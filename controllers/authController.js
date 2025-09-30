const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Normalize email
const normalizeEmail = (email) => {
  return email.toLowerCase().trim();
};

// Register new user
const register = async (req, res) => {
  try {
    console.log('Registration request body:', { 
      ...req.body, 
      password: '[HIDDEN]' 
    });

    const { fullName, email, password, role = 'student', major = '', graduationYear = '' } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Student-specific validation
    if (role === 'student') {
      if (!major.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Major is required for students'
        });
      }

      if (!graduationYear) {
        return res.status(400).json({
          success: false,
          message: 'Graduation year is required for students'
        });
      }

      const currentYear = new Date().getFullYear();
      const gradYear = parseInt(graduationYear);
      if (gradYear < currentYear || gradYear > currentYear + 10) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid graduation year'
        });
      }
    }

    // Check if user already exists in profiles table
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Database error during registration'
      });
    }

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email. Please try logging in instead.'
      });
    }

    // Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: fullName.trim(),
        role: role
      }
    });

    if (authError) {
      console.error('Supabase auth creation error:', authError);
      
      // Handle specific error cases
      if (authError.message?.includes('already registered') || authError.code === 'email_exists') {
        // Check if this user has a profile
        const { data: orphanedProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (!orphanedProfile) {
          // User exists in auth but no profile - they should try logging in (our login will create profile)
          return res.status(409).json({
            success: false,
            message: 'Account exists but incomplete setup. Please try logging in to complete your profile.',
            action: 'login'
          });
        } else {
          // User has both auth and profile - normal duplicate case
          return res.status(409).json({
            success: false,
            message: 'User already exists with this email. Please try logging in instead.',
            action: 'login'
          });
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account',
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account'
      });
    }

    console.log('User created in Supabase Auth:', authData.user.id);

    // Create comprehensive profile in database
    const profileData = {
      user_id: authData.user.id,
      email: normalizedEmail,
      name: fullName.trim(),
      role: role,
      bio: '',
      headline: '',
      location: '',
      hometown: '',
      avatar_url: '',
      profile_image_url: '',
      phone: '',
      phone_number: '',
      github_url: '',
      linkedin_url: '',
      portfolio_url: '',
      skills: [],
      interests: [],
      achievements: [],
      is_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add student-specific fields
    if (role === 'student') {
      if (major && major.trim()) {
        profileData.major = major.trim();
        profileData.department = major.trim(); // Also set department for compatibility
      }
      if (graduationYear) {
        const gradYear = parseInt(graduationYear);
        profileData.graduation_year = gradYear;
        // Calculate current year in program (1-4 typically)
        const currentYear = new Date().getFullYear();
        const yearInProgram = Math.max(1, Math.min(6, gradYear - currentYear + 1));
        profileData.year = yearInProgram;
      }
      profileData.student_id = ''; // Will be filled later by student
      profileData.gpa = null; // Will be filled later by student
      profileData.minor = '';
    }

    console.log('Creating profile:', profileData);
    
    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      console.error('Failed profile data:', profileData);
      
      // Clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile. Please try again.',
        error: profileError.message,
        details: profileError
      });
    }

    if (!profileResult) {
      console.error('Profile creation returned no data');
      // Cleanup auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile - no data returned'
      });
    }

    console.log('Profile created successfully:', profileResult.id);
    console.log('Registration completed for user:', normalizedEmail);

    // Generate JWT token
    const token = generateToken({
      id: authData.user.id,
      email: normalizedEmail,
      role: role
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: authData.user.id,
          email: normalizedEmail,
          role: role,
          profile: profileResult
        },
        token: token
      }
    });

    console.log('Registration completed successfully for:', normalizedEmail);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('Login request for:', req.body.email);

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (authError) {
      console.error('Login auth error:', authError);
      
      // Handle specific error cases
      if (authError.message?.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Login failed',
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(401).json({
        success: false,
        message: 'Login failed - no user data'
      });
    }

    // Get user profile (use maybeSingle to handle missing profiles)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error during login:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching profile',
        error: profileError.message
      });
    }

    let finalProfile = profileData;

    // If no profile exists, create one automatically
    if (!profileData) {
      console.log('No profile found for user, creating one...');
      
      const newProfileData = {
        user_id: authData.user.id,
        email: normalizedEmail,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        role: authData.user.user_metadata?.role || 'student',
        bio: '',
        department: '',
        major: '',
        minor: '',
        year: null,
        graduation_year: null,
        student_id: '',
        headline: '',
        location: '',
        hometown: '',
        gpa: null,
        phone_number: '',
        profile_image_url: '',
        skills: [],
        interests: [],
        achievements: [],
        github_url: '',
        linkedin_url: '',
        portfolio_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create profile during login:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user profile',
          error: createError.message
        });
      }

      console.log('Profile created successfully during login:', createdProfile.id);
      finalProfile = createdProfile;
    }

    // Generate JWT token
    const token = generateToken({
      id: authData.user.id,
      email: normalizedEmail,
      role: finalProfile.role
    });

    // Return success response
    res.json({
      success: true,
      message: finalProfile === profileData ? 'Login successful' : 'Login successful (profile created)',
      data: {
        user: {
          id: authData.user.id,
          email: normalizedEmail,
          role: finalProfile.role,
          profile: finalProfile
        },
        token: token
      }
    });

    console.log('Login successful for:', normalizedEmail);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error.message
    });
  }
};

// Get current user (for token verification)
const getMe = async (req, res) => {
  try {
    console.log('getMe called for user:', req.user?.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get fresh user data with profile
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(req.user.id);
    if (userError || !userData.user) {
      console.error('Failed to get user data:', userError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }

    const user = {
      id: userData.user.id,
      email: userData.user.email,
      role: profileData.role,
      profile: profileData
    };

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // But we can add server-side logout logic if needed (blacklist tokens, etc.)
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};