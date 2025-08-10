const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        profile: req.user.profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update user's profile
 */
const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, bio, department, year, skills, github_url, achievements } = req.body;
    const userId = req.user.id;

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    if (skills) updateData.skills = Array.isArray(skills) ? skills : [skills];
    if (github_url !== undefined) updateData.github_url = github_url;
    if (achievements) updateData.achievements = Array.isArray(achievements) ? achievements : [achievements];
    
    updateData.updated_at = new Date().toISOString();

    // Update profile in database
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all user profiles (for directory/search)
 */
const getAllProfiles = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('id, user_id, name, email, role, bio, department, year, skills, github_url')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Get profiles error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch profiles',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: profiles.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get specific user profile by ID
 */
const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        endorsements:endorsements!student_id (
          id,
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
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get profile by ID error:', error);
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllProfiles,
  getProfileById
};