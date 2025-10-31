const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { 
  searchStudents, 
  getStudentProfile, 
  exportSingleResume, 
  exportBatchResumes,
  getExportJob,
  getExportHistory 
} = require('../controllers/tpcController');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check TPC role
const checkTPCRole = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(403).json({ error: 'Unable to verify TPC access' });
    }
    
    if (!profile || !['admin', 'tpc_admin'].includes(profile.role)) {
      return res.status(403).json({ 
        error: 'TPC access required',
        detail: `Current role: ${profile?.role || 'none'}. Required: admin or tpc_admin`
      });
    }
    
    next();
  } catch (error) {
    console.error('TPC role check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply auth and TPC role check to all routes
router.use(auth);
router.use(checkTPCRole);

// Search students with advanced filtering
router.post('/students/search', async (req, res) => {
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
      limit = 20,
      offset = 0
    } = req.body;

    let supabaseQuery = supabase
      .from('profiles')
      .select(`
        id,
        student_id,
        full_name,
        email,
        phone,
        avatar_url,
        department,
        graduation_year,
        current_semester,
        gpa,
        bio,
        skills,
        verification_status,
        profile_completeness,
        location,
        last_active,
        created_at,
        projects:project_profiles(id, title, description, technologies),
        experience:experience_profiles(id, company, position, start_date, end_date)
      `, { count: 'exact' })
      .neq('role', 'tpc_admin')
      .order('updated_at', { ascending: false });

    // Text search across multiple fields
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `full_name.ilike.%${query}%,student_id.ilike.%${query}%,email.ilike.%${query}%,bio.ilike.%${query}%`
      );
    }

    // Department filter
    if (department) {
      supabaseQuery = supabaseQuery.eq('department', department);
    }

    // Graduation year filter
    if (graduation_year) {
      supabaseQuery = supabaseQuery.eq('graduation_year', graduation_year);
    }

    // GPA filter
    if (min_gpa) {
      supabaseQuery = supabaseQuery.gte('gpa', min_gpa);
    }

    // Verification status filter
    if (verified_only) {
      supabaseQuery = supabaseQuery.eq('verification_status', 'verified');
    }

    // Skills filter
    if (skills && skills.length > 0) {
      if (skills_match === 'all') {
        // All skills must match
        supabaseQuery = supabaseQuery.contains('skills', skills);
      } else {
        // Any skill matches
        const skillConditions = skills.map(skill => `skills.cs.{${skill}}`).join(',');
        supabaseQuery = supabaseQuery.or(skillConditions);
      }
    }

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data: students, error, count } = await supabaseQuery;

    if (error) {
      console.error('Student search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    // Filter by projects and experience (client-side due to complex joins)
    let filteredStudents = students;
    
    if (has_projects) {
      filteredStudents = filteredStudents.filter(student => 
        student.projects && student.projects.length > 0
      );
    }
    
    if (has_experience) {
      filteredStudents = filteredStudents.filter(student => 
        student.experience && student.experience.length > 0
      );
    }

    // Log search activity
    await supabase
      .from('tpc_search_history')
      .insert({
        user_id: req.user.id,
        query: query || null,
        filters: {
          department,
          graduation_year,
          skills,
          skills_match,
          min_gpa,
          verified_only,
          has_projects,
          has_experience
        },
        results_count: count,
        created_at: new Date().toISOString()
      });

    res.json({
      data: filteredStudents,
      count: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student profile details
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('profiles')
      .select(`
        *,
        projects:project_profiles(*),
        experience:experience_profiles(*),
        education:education_profiles(*)
      `)
      .eq('id', id)
      .neq('role', 'tpc_admin')
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Log profile access
    await supabase
      .from('tpc_access_logs')
      .insert({
        user_id: req.user.id,
        student_id: id,
        action: 'profile_view',
        created_at: new Date().toISOString()
      });

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export student resumes
router.post('/export/resumes', async (req, res) => {
  try {
    const { student_ids, export_format = 'pdf' } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    if (student_ids.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 students allowed per export' });
    }

    // Create export job
    const { data: exportJob, error: jobError } = await supabase
      .from('tpc_export_jobs')
      .insert({
        user_id: req.user.id,
        student_ids,
        export_format,
        status: 'pending',
        student_count: student_ids.length,
        filters: req.body.filters || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Export job creation error:', jobError);
      return res.status(500).json({ error: 'Failed to create export job' });
    }

    // Trigger background job (this would typically be done via a job queue)
    // For now, we'll return the job ID and process it asynchronously
    processExportJob(exportJob.id);

    res.json({
      job_id: exportJob.id,
      message: 'Export job created successfully',
      estimated_time: Math.ceil(student_ids.length / 10) + ' minutes'
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get export jobs
router.get('/export/jobs', async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('tpc_export_jobs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Get export jobs error:', error);
      return res.status(500).json({ error: 'Failed to get export jobs' });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Get export jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download export
router.get('/export/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: job, error } = await supabase
      .from('tpc_export_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Export not ready for download' });
    }

    if (!job.download_url) {
      return res.status(404).json({ error: 'Download file not found' });
    }

    // Check if file has expired
    if (new Date() > new Date(job.expires_at)) {
      return res.status(410).json({ error: 'Download has expired' });
    }

    // Log download activity
    await supabase
      .from('tpc_access_logs')
      .insert({
        user_id: req.user.id,
        action: 'export_download',
        metadata: { job_id: jobId },
        created_at: new Date().toISOString()
      });

    // Redirect to the download URL or stream the file
    res.redirect(job.download_url);
  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete export job
router.delete('/export/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const { error } = await supabase
      .from('tpc_export_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Delete export job error:', error);
      return res.status(500).json({ error: 'Failed to delete export job' });
    }

    res.json({ message: 'Export job deleted successfully' });
  } catch (error) {
    console.error('Delete export job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get search history
router.get('/search/history', async (req, res) => {
  try {
    const { data: history, error } = await supabase
      .from('tpc_search_history')
      .select('query, filters, results_count, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Get search history error:', error);
      return res.status(500).json({ error: 'Failed to get search history' });
    }

    res.json(history);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get filter options
router.get('/filters/departments', async (req, res) => {
  try {
    const { data: departments, error } = await supabase
      .from('profiles')
      .select('department')
      .neq('role', 'tpc_admin')
      .not('department', 'is', null);

    if (error) {
      console.error('Get departments error:', error);
      return res.status(500).json({ error: 'Failed to get departments' });
    }

    const uniqueDepartments = [...new Set(departments.map(item => item.department))].sort();
    res.json(uniqueDepartments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/filters/skills', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('skills')
      .neq('role', 'tpc_admin')
      .not('skills', 'is', null);

    if (error) {
      console.error('Get skills error:', error);
      return res.status(500).json({ error: 'Failed to get skills' });
    }

    const allSkills = profiles.flatMap(profile => profile.skills || []);
    const uniqueSkills = [...new Set(allSkills)].sort();
    res.json(uniqueSkills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/filters/graduation-years', async (req, res) => {
  try {
    const { data: years, error } = await supabase
      .from('profiles')
      .select('graduation_year')
      .neq('role', 'tpc_admin')
      .not('graduation_year', 'is', null);

    if (error) {
      console.error('Get graduation years error:', error);
      return res.status(500).json({ error: 'Failed to get graduation years' });
    }

    const uniqueYears = [...new Set(years.map(item => item.graduation_year))].sort((a, b) => b - a);
    res.json(uniqueYears);
  } catch (error) {
    console.error('Get graduation years error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background job processor (simplified version)
async function processExportJob(jobId) {
  try {
    // Update job status to processing
    await supabase
      .from('tpc_export_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 0
      })
      .eq('id', jobId);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('tpc_export_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    // Get student data
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select(`
        *,
        projects:project_profiles(*),
        experience:experience_profiles(*),
        education:education_profiles(*)
      `)
      .in('id', job.student_ids);

    if (studentsError) {
      throw new Error('Failed to get student data');
    }

    // Process students (this would typically call the resume generation service)
    const totalStudents = students.length;
    let processedStudents = 0;

    for (const student of students) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      processedStudents++;
      const progress = Math.round((processedStudents / totalStudents) * 100);
      
      // Update progress
      await supabase
        .from('tpc_export_jobs')
        .update({ progress })
        .eq('id', jobId);
    }

    // Mark job as completed
    const downloadUrl = `${process.env.APP_URL}/api/tpc/export/${jobId}/download`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await supabase
      .from('tpc_export_jobs')
      .update({
        status: 'completed',
        progress: 100,
        download_url: downloadUrl,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        file_size: totalStudents * 1024 * 50 // Estimated file size
      })
      .eq('id', jobId);

  } catch (error) {
    console.error('Export job processing error:', error);
    
    // Mark job as failed
    await supabase
      .from('tpc_export_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

// Apply auth and TPC check to all routes
router.use(auth);
router.use(checkTPCRole);

// Student search and profile routes
router.get('/search', validatePagination, searchStudents);
router.get('/profile/:studentId', getStudentProfile);

// Resume export routes
router.post('/export/single', exportSingleResume);
router.post('/export/batch', exportBatchResumes);

// Export job management
router.get('/export/jobs/:jobId', getExportJob);
router.get('/export/history', getExportHistory);

// Filter data endpoints (for dropdowns)
router.get('/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .not('department', 'is', null)
      .eq('role', 'student');
    
    if (error) throw error;
    
    const departments = [...new Set(data.map(p => p.department))].filter(Boolean).sort();
    res.json({ success: true, data: { departments } });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

router.get('/skills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('skills')
      .not('skills', 'is', null)
      .eq('role', 'student');
    
    if (error) throw error;
    
    const allSkills = data.flatMap(p => p.skills || []);
    const skills = [...new Set(allSkills)].filter(Boolean).sort();
    res.json({ success: true, data: { skills } });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch skills' });
  }
});

router.get('/graduation-years', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('graduation_year')
      .not('graduation_year', 'is', null)
      .eq('role', 'student');
    
    if (error) throw error;
    
    const years = [...new Set(data.map(p => p.graduation_year))].filter(Boolean).sort();
    res.json({ success: true, data: { years } });
  } catch (error) {
    console.error('Error fetching graduation years:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch graduation years' });
  }
});

module.exports = router;