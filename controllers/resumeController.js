const puppeteer = require('puppeteer');
const supabase = require('../config/supabase');

/**
 * Generate HTML template for resume
 */
const generateResumeHTML = (profile, endorsements, posts) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${profile.name} - Resume</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
          background: #fff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #007bff;
          font-size: 2.5em;
        }
        .header p {
          margin: 5px 0;
          font-size: 1.1em;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #007bff;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .bio {
          font-style: italic;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skill-tag {
          background: #007bff;
          color: white;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 0.9em;
        }
        .project {
          border: 1px solid #eee;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .project h3 {
          margin-top: 0;
          color: #333;
        }
        .project-tags {
          display: flex;
          gap: 5px;
          margin-top: 10px;
        }
        .tag {
          background: #28a745;
          color: white;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 0.8em;
        }
        .endorsement {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 15px;
          margin-bottom: 15px;
        }
        .endorsement-author {
          font-weight: bold;
          color: #007bff;
        }
        .achievements {
          list-style-type: none;
          padding: 0;
        }
        .achievements li {
          background: #e9ecef;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
          position: relative;
          padding-left: 30px;
        }
        .achievements li:before {
          content: "🏆";
          position: absolute;
          left: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${profile.name}</h1>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Department:</strong> ${profile.department}</p>
          ${profile.year ? `<p><strong>Year:</strong> ${profile.year}</p>` : ''}
          ${profile.github_url ? `<p><strong>GitHub:</strong> <a href="${profile.github_url}">${profile.github_url}</a></p>` : ''}
        </div>

        ${profile.bio ? `
        <div class="section">
          <h2>About Me</h2>
          <div class="bio">${profile.bio}</div>
        </div>
        ` : ''}

        ${profile.skills && profile.skills.length > 0 ? `
        <div class="section">
          <h2>Skills</h2>
          <div class="skills">
            ${profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${posts && posts.length > 0 ? `
        <div class="section">
          <h2>Projects</h2>
          ${posts.map(post => `
            <div class="project">
              <h3>${post.title}</h3>
              <p>${post.description}</p>
              ${post.tags && post.tags.length > 0 ? `
                <div class="project-tags">
                  ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${endorsements && endorsements.length > 0 ? `
        <div class="section">
          <h2>Faculty Endorsements</h2>
          ${endorsements.map(endorsement => `
            <div class="endorsement">
              <div class="endorsement-author">
                ${endorsement.faculty.name} - ${endorsement.faculty.department}
              </div>
              <p><strong>Project:</strong> ${endorsement.project.title}</p>
              ${endorsement.endorsement_text ? `<p>${endorsement.endorsement_text}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${profile.achievements && profile.achievements.length > 0 ? `
        <div class="section">
          <h2>Achievements</h2>
          <ul class="achievements">
            ${profile.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by Campus Connect • ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate PDF resume for a student
 */
const generateResume = async (req, res) => {
  let browser;
  try {
    const { studentId } = req.params;

    // Get student profile with related data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Verify it's a student profile
    if (profile.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Resume can only be generated for students'
      });
    }

    // Get student's projects/posts
    const { data: posts } = await supabase
      .from('posts')
      .select('title, description, tags, created_at')
      .eq('created_by', studentId)
      .order('created_at', { ascending: false });

    // Get student's endorsements
    const { data: endorsements } = await supabase
      .from('endorsements')
      .select(`
        endorsement_text,
        created_at,
        faculty:profiles!faculty_id (
          name,
          department
        ),
        project:posts!project_id (
          title,
          description
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Generate HTML
    const html = generateResumeHTML(profile, endorsements || [], posts || []);

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();
    browser = null;

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${profile.name}_Resume.pdf"`);
    res.setHeader('Content-Length', pdf.length);

    res.send(pdf);
  } catch (error) {
    console.error('Generate resume error:', error);
    
    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
};

/**
 * Get resume data as JSON (for preview)
 */
const getResumeData = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    if (profile.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Resume data can only be retrieved for students'
      });
    }

    // Get student's projects
    const { data: posts } = await supabase
      .from('posts')
      .select('title, description, tags, created_at, likes_count, comments_count')
      .eq('created_by', studentId)
      .order('created_at', { ascending: false });

    // Get student's endorsements
    const { data: endorsements } = await supabase
      .from('endorsements')
      .select(`
        endorsement_text,
        created_at,
        faculty:profiles!faculty_id (
          name,
          department,
          role
        ),
        project:posts!project_id (
          title,
          description
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      data: {
        profile,
        projects: posts || [],
        endorsements: endorsements || []
      }
    });
  } catch (error) {
    console.error('Get resume data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  generateResume,
  getResumeData
};