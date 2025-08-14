const supabase = require('../config/supabase');
const { generateResumeHTML } = require('./resumeController');
const puppeteer = require('puppeteer');

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        posts:posts!created_by (count),
        endorsements_received:endorsements!student_id (count),
        endorsements_given:endorsements!faculty_id (count)
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Get all users error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: users.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get platform statistics (admin only)
 */
const getStatistics = async (req, res) => {
  try {
    // Get user counts by role
    const { data: userStats, error: userStatsError } = await supabase
      .from('profiles')
      .select('role')
      .then(({ data, error }) => {
        if (error) return { error };
        
        const stats = data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        
        return { data: stats };
      });

    if (userStatsError) {
      throw userStatsError;
    }

    // Get total posts count
    const { count: totalPosts, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (postsError) {
      throw postsError;
    }

    // Get total endorsements count
    const { count: totalEndorsements, error: endorsementsError } = await supabase
      .from('endorsements')
      .select('*', { count: 'exact', head: true });

    if (endorsementsError) {
      throw endorsementsError;
    }

    // Get total messages count
    const { count: totalMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (messagesError) {
      throw messagesError;
    }

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentPostsData, error: recentPostsError } = await supabase
      .from('posts')
      .select('*')
      .gte('created_at', thirtyDaysAgo);

    const { data: recentUsersData, error: recentUsersError } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', thirtyDaysAgo);

    res.json({
      success: true,
      data: {
        users: {
          total: Object.values(userStats || {}).reduce((sum, count) => sum + count, 0),
          students: userStats?.student || 0,
          faculty: userStats?.faculty || 0,
          admins: userStats?.admin || 0,
          recent: recentUsersData?.length || 0
        },
        posts: {
          total: totalPosts || 0,
          recent: recentPostsData?.length || 0
        },
        endorsements: {
          total: totalEndorsements || 0
        },
        messages: {
          total: totalMessages || 0
        }
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Export student profile as PDF (admin only)
 */
const exportStudentProfile = async (req, res) => {
  let browser;
  try {
    const { studentId } = req.params;

    // Get complete student data
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

    // Get student's posts
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
          department
        ),
        project:posts!project_id (
          title,
          description
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Generate HTML (reuse the resume HTML generator)
    const html = generateResumeHTML(profile, endorsements || [], posts || []);

    // Generate PDF
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

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${profile.name}_Profile_Export.pdf"`);
    res.setHeader('Content-Length', pdf.length);

    res.send(pdf);
  } catch (error) {
    console.error('Export student profile error:', error);
    
    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      success: false,
      message: 'Failed to export student profile',
      error: error.message
    });
  }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: student, faculty, admin'
      });
    }

    // Prevent admin from changing their own role to non-admin
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user role error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user from auth (this will cascade delete profile due to foreign key)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Delete user auth error:', authError);
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user',
        error: authError.message
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getStatistics,
  exportStudentProfile,
  updateUserRole,
  deleteUser
};