const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch complete profile data from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        profile
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
    console.log('=== Profile Update Request ===')
    console.log('User ID:', req.user.id)
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('Content-Type:', req.headers['content-type'])
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array())
      console.log('Request body that failed validation:', req.body)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    console.log('✅ Validation passed')

    const { 
      name, 
      bio, 
      department, 
      major,
      year, 
      graduation_year,
      student_id,
      phone,
      phone_number,
      headline,
      location,
      hometown,
      gpa,
      minor,
      avatar_url,
      profile_image_url,
      skills, 
      interests,
      github_url,
      linkedin_url,
      portfolio_url,
      achievements
    } = req.body;
    const userId = req.user.id;

    // Prepare update data - include ALL profile fields from database schema
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (department !== undefined) updateData.department = department;
    if (major !== undefined) updateData.major = major;
    if (year !== undefined) updateData.year = parseInt(year) || null;
    if (graduation_year !== undefined) updateData.graduation_year = parseInt(graduation_year) || null;
    if (student_id !== undefined) updateData.student_id = student_id;
    
    // Handle phone number field (support both field names for compatibility)
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (phone !== undefined) updateData.phone = phone;
    
    if (headline !== undefined) updateData.headline = headline;
    if (location !== undefined) updateData.location = location;
    if (hometown !== undefined) updateData.hometown = hometown;
    if (gpa !== undefined) updateData.gpa = gpa ? parseFloat(gpa) : null;
    if (minor !== undefined) updateData.minor = minor;
    
    // Handle image fields
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;
    
    // Handle arrays properly
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    if (interests !== undefined) updateData.interests = Array.isArray(interests) ? interests : (interests ? [interests] : []);
    if (github_url !== undefined) updateData.github_url = github_url;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url;
    if (achievements !== undefined) updateData.achievements = Array.isArray(achievements) ? achievements : (achievements ? [achievements] : []);
    
    updateData.updated_at = new Date().toISOString();

    console.log('Controller received update data:', updateData);

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
 * Get all user profiles (for directory/search) - Read-only access
 */
const getAllProfiles = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Start with basic query that we know works
    let query = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        name,
        role,
        bio,
        department,
        year,
        skills,
        github_url,
        achievements,
        created_at
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply search filter - simple text matching
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Try a simpler approach first
      query = query.ilike('name', `%${searchTerm}%`);
    }

    // Apply role filter
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    
    // Apply department filter
    if (department && department !== 'all') {
      query = query.ilike('department', `%${department}%`);
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

    // Transform data for frontend - ensure read-only structure
    const transformedProfiles = profiles.map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name || 'Anonymous User',
      email: 'Not available', // We'll add email lookup later
      role: profile.role || 'student',
      bio: profile.bio || 'No bio available',
      department: profile.department || 'Not specified',
      year: profile.year,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      github_url: profile.github_url,
      achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
      joined: profile.created_at,
      // Mark as read-only
      isReadOnly: true,
      canEdit: false
    }));

    res.json({
      success: true,
      data: {
        profiles: transformedProfiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: profiles.length === parseInt(limit)
        },
        meta: {
          total: transformedProfiles.length,
          searchTerm: search || null,
          filters: { role, department }
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
    console.log('=== Get Profile By ID Request ===')
    console.log('Requested User ID:', userId)
    console.log('Requesting User ID:', req.user.id)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Get profile by ID error:', error);
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        error: error.message
      });
    }

    console.log('✅ Profile fetched successfully for user:', userId)
    console.log('Profile data keys:', Object.keys(profile))

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