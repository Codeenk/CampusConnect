import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import net from 'net';

// Load env from apps/tpc-portal/.env.local
dotenv.config({ path: './.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// Default backend port for the API server. Change via PORT in .env.local if needed.
let PORT = process.env.PORT || 3001;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration in apps/tpc-portal/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Helper: verify bearer token with Supabase and return user object
const verifyToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn('Token verification failed', error?.message || 'no user');
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.supabaseUser = data.user;
    next();
  } catch (err) {
    console.error('verifyToken error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};

// Helper: check role is admin or tpc_admin
const requireTpcAdmin = async (req, res, next) => {
  try {
    const userId = req.supabaseUser?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile for role check', error);
      return res.status(500).json({ success: false, message: 'Internal error' });
    }

    if (!profile || !['admin', 'tpc_admin'].includes(profile.role)) {
      return res.status(403).json({ success: false, message: 'TPC admin access required' });
    }

    next();
  } catch (err) {
    console.error('requireTpcAdmin error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};

// Auth: login -> use Supabase signInWithPassword and return token + profile
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.warn('Supabase login failed', authError.message);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = authData.user;

    // Fetch or create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error during login', profileError);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    let finalProfile = profileData;
    if (!finalProfile) {
      // create lightweight profile to keep app working
      const newProfile = {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        role: user.user_metadata?.role || 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .maybeSingle();
      if (createErr) console.warn('Could not create profile on login', createErr.message);
      finalProfile = created || newProfile;
    }

    // Return the Supabase access token as `token` to the frontend so subsequent calls can be verified
    const token = authData.session?.access_token || null;

    res.json({ success: true, data: { user: { id: user.id, email: user.email, role: finalProfile.role, profile: finalProfile }, token } });
  } catch (err) {
    console.error('Login handler error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Get current user (requires token)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const userId = req.supabaseUser.id;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, message: 'Failed to get profile' });

    res.json({ success: true, data: { user: { id: userId, email: req.supabaseUser.email, role: profile?.role || 'student', profile } } });
  } catch (err) {
    console.error('getMe error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// TPC routes (require auth + tpc admin role)
app.get('/api/tpc/search', verifyToken, requireTpcAdmin, async (req, res) => {
  try {
    const {
      query,
      department,
      graduation_year,
      skills,
      skills_match = 'any',
      min_gpa,
      verified_only,
      has_projects,
      has_experience,
      page = 1,
      per_page = 20
    } = req.query;

    let supabaseQuery = supabase
      .from('profiles')
      .select(
        `id, user_id, name, email, role, created_at, updated_at`,
        { count: 'exact' }
      )
      .eq('role', 'student')
      .order('updated_at', { ascending: false });

    if (query) {
      const q = query;
      supabaseQuery = supabaseQuery.or(
        `full_name.ilike.%${q}%,student_id.ilike.%${q}%,email.ilike.%${q}%,bio.ilike.%${q}%`
      );
    }

    if (department) supabaseQuery = supabaseQuery.eq('department', department);
    if (graduation_year) supabaseQuery = supabaseQuery.eq('graduation_year', parseInt(graduation_year));
    if (min_gpa) supabaseQuery = supabaseQuery.gte('gpa', parseFloat(min_gpa));
    if (verified_only) supabaseQuery = supabaseQuery.eq('verification_status', 'verified');

    if (skills) {
      const skillsArr = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArr.length) {
        if (skills_match === 'all') supabaseQuery = supabaseQuery.contains('skills', skillsArr);
        else {
          // any: build OR conditions
          const orConditions = skillsArr.map(s => `skills.cs.{${s}}`).join(',');
          supabaseQuery = supabaseQuery.or(orConditions);
        }
      }
    }

  const pageNum = parseInt(String(page || '1')) || 1;
  const perPageNum = parseInt(String(per_page || '20')) || 20;
  const from = (pageNum - 1) * perPageNum;
  const to = from + perPageNum - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    const { data: students, error, count } = await supabaseQuery;
    if (error) {
      console.error('Search query failed', error);
      return res.status(500).json({ success: false, message: 'Search failed' });
    }

    // client-side filters for projects/experience
    let filtered = students || [];
    if (has_projects === 'true' || has_projects === true) {
      filtered = filtered.filter(s => s.projects && s.projects.length > 0);
    }
    if (has_experience === 'true' || has_experience === true) {
      filtered = filtered.filter(s => s.experience && s.experience.length > 0);
    }

    res.json({ success: true, data: filtered, count: count || filtered.length, limit: perPageNum, offset: from });
  } catch (err) {
    console.error('TPC search error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.get('/api/tpc/profile/:studentId', verifyToken, requireTpcAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data: student, error } = await supabase
      .from('profiles')
      .select(`*`)
      .eq('id', studentId)
      .eq('role', 'student')
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: { student } });
  } catch (err) {
    console.error('Get student error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Filter endpoints (public for authenticated TPC)
app.get('/api/tpc/departments', verifyToken, requireTpcAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .eq('role', 'student')
      .not('department', 'is', null);
    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch departments' });

    // Extract unique departments
    const departments = Array.from(new Set((data || []).map(item => item.department))).filter(Boolean);

    res.json({ success: true, data: departments });
  } catch (err) {
    console.error('Get departments error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.get('/api/tpc/graduation_years', verifyToken, requireTpcAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('graduation_year')
      .eq('role', 'student')
      .not('graduation_year', 'is', null);
    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch graduation years' });

    // Extract unique graduation years
    const graduationYears = Array.from(new Set((data || []).map(item => item.graduation_year))).filter(Boolean);

    res.json({ success: true, data: graduationYears });
  } catch (err) {
    console.error('Get graduation years error', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Simple health endpoint (already patched above)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TPC Portal backend running', port: PORT });
});

// Robust port selection and server startup
function findFreePort(startPort = 3001, maxTries = 10) {
  return new Promise((resolve) => {
    let port = startPort;
    function tryPort() {
      const server = net.createServer();
      server.once('error', () => {
        port++;
        if (port > startPort + maxTries) resolve(startPort); // fallback to startPort
        else tryPort();
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port);
    }
    tryPort();
  });
}

findFreePort(Number(PORT)).then((freePort) => {
  PORT = freePort;
  app.listen(PORT, () => {
    console.log(`TPC Portal backend listening on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
  });
});
