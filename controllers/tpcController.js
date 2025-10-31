const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');

/**
 * Search students with filters
 */
const searchStudents = async (req, res) => {
  try {
    const { 
      query = '', 
      department = '', 
      year = '', 
      skills = '', 
      min_readiness = 0,
      verified_only = false,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('profiles')
      .select(`
        user_id,
        name,
        email,
        department,
        major,
        year,
        graduation_year,
        gpa,
        skills,
        achievements,
        bio,
        linkedin_url,
        github_url,
        student_id,
        avatar_url,
        created_at
      `)
      .eq('role', 'student')
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    // Apply filters
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,student_id.ilike.%${query}%`);
    }

    if (department) {
      dbQuery = dbQuery.eq('department', department);
    }

    if (year) {
      dbQuery = dbQuery.eq('year', year);
    }

    if (skills) {
      const skillsList = skills.split(',').map(s => s.trim());
      dbQuery = dbQuery.overlaps('skills', skillsList);
    }

    if (min_readiness > 0) {
      // Calculate readiness score based on profile completeness
      // This is a simplified version - you can enhance this logic
    }

    const { data: students, error, count } = await dbQuery;

    if (error) {
      console.error('Search students error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to search students',
        error: error.message
      });
    }

    // Calculate readiness scores and filter verified if needed
    const processedStudents = students.map(student => {
      const completionScore = calculateReadinessScore(student);
      const verifiedScore = verified_only ? getVerificationScore(student) : 100;
      
      return {
        ...student,
        readiness_score: completionScore,
        verified_items: verifiedScore,
        skills_summary: student.skills ? student.skills.slice(0, 5) : []
      };
    }).filter(student => 
      student.readiness_score >= min_readiness && 
      (!verified_only || student.verified_items >= 50)
    );

    res.json({
      success: true,
      data: {
        students: processedStudents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || processedStudents.length
        }
      }
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get detailed student profile
 */
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get profile with related data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *
      `)
      .eq('user_id', studentId)
      .eq('role', 'student')
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get posts (projects)
    const { data: projects } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        description,
        content,
        tags,
        github_repo,
        live_demo_url,
        created_at,
        likes_count,
        views_count
      `)
      .eq('created_by', studentId)
      .order('created_at', { ascending: false });

    // Get endorsements
    const { data: endorsements } = await supabase
      .from('endorsements')
      .select(`
        id,
        endorsement_text,
        skills_endorsed,
        rating,
        created_at,
        faculty:profiles!faculty_id (
          name,
          department,
          role
        )
      `)
      .eq('student_id', studentId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Process achievements to extract structured data
    const processedProfile = {
      ...profile,
      projects: projects || [],
      endorsements: endorsements || [],
      experience: extractFromAchievements(profile.achievements, 'experience'),
      certifications: extractFromAchievements(profile.achievements, 'certification'),
      education: extractFromAchievements(profile.achievements, 'education'),
      readiness_score: calculateReadinessScore(profile)
    };

    res.json({
      success: true,
      data: { profile: processedProfile }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Export single student resume
 */
const exportSingleResume = async (req, res) => {
  try {
    const { studentId, format = 'pdf', template = 'standard', verifiedOnly = false } = req.body;

    // Get student profile
    const profileResponse = await getStudentProfile({ params: { studentId } }, { 
      json: (data) => data 
    });
    
    const profile = profileResponse.data.profile;

    // Generate resume HTML
    const resumeHTML = generateStandardResumeHTML(profile, { verifiedOnly });

    if (format === 'pdf') {
      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(resumeHTML, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${profile.student_id || profile.name}_Resume.pdf"`);
      res.send(pdfBuffer);
    } else {
      // Return HTML for now (DOCX can be implemented later)
      res.setHeader('Content-Type', 'text/html');
      res.send(resumeHTML);
    }
  } catch (error) {
    console.error('Export single resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export resume',
      error: error.message
    });
  }
};

/**
 * Export batch resumes
 */
const exportBatchResumes = async (req, res) => {
  try {
    const { 
      studentIds, 
      filters = {}, 
      format = 'pdf', 
      template = 'standard', 
      verifiedOnly = false 
    } = req.body;

    // If more than 100 students, create background job
    if (studentIds.length > 100) {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create job record
      const { error } = await supabase
        .from('tpc_export_jobs')
        .insert({
          id: jobId,
          created_by: req.user.id,
          filters: JSON.stringify({ studentIds, filters, format, template, verifiedOnly }),
          total: studentIds.length,
          status: 'queued'
        });

      if (error) {
        throw error;
      }

      // Start background processing (simplified - in production use a proper queue)
      processBatchExportJob(jobId);

      return res.json({
        success: true,
        data: { 
          jobId,
          message: 'Batch export job created. You will be notified when ready.' 
        }
      });
    }

    // Process immediately for smaller batches
    const zipBuffer = await createBatchZip(studentIds, { format, template, verifiedOnly });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="batch_resumes_${Date.now()}.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Export batch resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export batch resumes',
      error: error.message
    });
  }
};

/**
 * Get export job status
 */
const getExportJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: job, error } = await supabase
      .from('tpc_export_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('created_by', req.user.id)
      .single();

    if (error || !job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: { job }
    });
  } catch (error) {
    console.error('Get export job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get export history
 */
const getExportHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: jobs, error } = await supabase
      .from('tpc_export_jobs')
      .select('*')
      .eq('created_by', req.user.id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: { jobs }
    });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper functions
function calculateReadinessScore(profile) {
  let score = 0;
  
  if (profile.name) score += 10;
  if (profile.email) score += 10;
  if (profile.bio) score += 15;
  if (profile.department) score += 10;
  if (profile.major) score += 10;
  if (profile.gpa) score += 15;
  if (profile.skills && profile.skills.length > 0) score += 20;
  if (profile.linkedin_url) score += 10;
  if (profile.github_url) score += 10;
  
  return Math.min(score, 100);
}

function getVerificationScore(profile) {
  // Simplified verification logic
  return 75; // Placeholder
}

function extractFromAchievements(achievements, type) {
  if (!achievements || !Array.isArray(achievements)) return [];
  
  return achievements
    .filter(item => {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          return parsed.type === type;
        } catch {
          return false;
        }
      }
      return item.type === type;
    })
    .map(item => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }
      return item;
    })
    .filter(Boolean);
}

function generateStandardResumeHTML(profile, options = {}) {
  const { verifiedOnly = false } = options;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${profile.name} - Resume</title>
      <style>
        body {
          font-family: 'Inter', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24pt;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1e40af;
        }
        .header .contact {
          font-size: 10pt;
          color: #666;
        }
        .section {
          margin-bottom: 18px;
        }
        .section h2 {
          font-size: 12pt;
          font-weight: 600;
          color: #1e40af;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .item {
          margin-bottom: 12px;
        }
        .item h3 {
          font-size: 11pt;
          font-weight: 600;
          margin: 0 0 2px 0;
        }
        .item .meta {
          font-size: 10pt;
          color: #666;
          font-style: italic;
          margin-bottom: 4px;
        }
        .item .description {
          font-size: 10pt;
          line-height: 1.3;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 9pt;
          border: 1px solid #e2e8f0;
        }
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media print {
          body { margin: 0; padding: 0.5in; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${profile.name}</h1>
        <div class="contact">
          ${profile.email}${profile.linkedin_url ? ` • LinkedIn: ${profile.linkedin_url}` : ''}${profile.github_url ? ` • GitHub: ${profile.github_url}` : ''}
        </div>
        ${profile.student_id ? `<div class="contact">Student ID: ${profile.student_id}</div>` : ''}
      </div>

      ${profile.bio ? `
      <div class="section">
        <h2>Summary</h2>
        <p>${profile.bio}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>Education</h2>
        <div class="item">
          <h3>${profile.major || 'Computer Science'}</h3>
          <div class="meta">${profile.department || 'Engineering'} • ${profile.year ? `Year ${profile.year}` : ''} • Expected ${profile.graduation_year || '2025'}</div>
          ${profile.gpa ? `<div class="meta">GPA: ${profile.gpa}/4.0</div>` : ''}
        </div>
      </div>

      ${profile.skills && profile.skills.length > 0 ? `
      <div class="section">
        <h2>Technical Skills</h2>
        <div class="skills">
          ${profile.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${profile.projects && profile.projects.length > 0 ? `
      <div class="section">
        <h2>Projects</h2>
        ${profile.projects.slice(0, 5).map(project => `
          <div class="item">
            <h3>${project.title}</h3>
            <div class="meta">${project.github_repo ? `GitHub: ${project.github_repo}` : ''}${project.live_demo_url ? ` • Demo: ${project.live_demo_url}` : ''}</div>
            <div class="description">${project.description}</div>
            ${project.tags && project.tags.length > 0 ? `<div class="meta">Technologies: ${project.tags.join(', ')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${profile.experience && profile.experience.length > 0 ? `
      <div class="section">
        <h2>Experience</h2>
        ${profile.experience.map(exp => `
          <div class="item">
            <h3>${exp.position || exp.title}</h3>
            <div class="meta">${exp.company} • ${exp.start_date}${exp.end_date ? ` - ${exp.end_date}` : ' - Present'}</div>
            <div class="description">${exp.description || ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${profile.certifications && profile.certifications.length > 0 ? `
      <div class="section">
        <h2>Certifications</h2>
        ${profile.certifications.map(cert => `
          <div class="item">
            <h3>${cert.name}</h3>
            <div class="meta">${cert.issuer}${cert.date ? ` • ${cert.date}` : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${profile.endorsements && profile.endorsements.length > 0 ? `
      <div class="section">
        <h2>Faculty Endorsements</h2>
        ${profile.endorsements.slice(0, 3).map(endorsement => `
          <div class="item">
            <div class="description">"${endorsement.endorsement_text}"</div>
            <div class="meta">— ${endorsement.faculty.name}, ${endorsement.faculty.department}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </body>
    </html>
  `;
}

async function createBatchZip(studentIds, options) {
  return new Promise((resolve, reject) => {
    // Implementation for creating ZIP file with multiple resumes
    // This is a simplified version - full implementation would process each student
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];

    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Add placeholder file for now
    archive.append('Batch export functionality coming soon', { name: 'readme.txt' });
    archive.finalize();
  });
}

async function processBatchExportJob(jobId) {
  // Background job processing - simplified implementation
  setTimeout(async () => {
    await supabase
      .from('tpc_export_jobs')
      .update({ 
        status: 'completed',
        processed: 100,
        artifact_url: `https://storage.example.com/exports/${jobId}.zip`
      })
      .eq('id', jobId);
  }, 5000);
}

module.exports = {
  searchStudents,
  getStudentProfile,
  exportSingleResume,
  exportBatchResumes,
  getExportJob,
  getExportHistory
};