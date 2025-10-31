const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Create endorsement for a student
 */
const createEndorsement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { student_id, post_id, endorsement_text, skills_endorsed, rating } = req.body;
    const faculty_id = req.user.id;

    // Verify faculty role
    const { data: facultyProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', faculty_id)
      .single();

    if (!facultyProfile || facultyProfile.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty members can create endorsements'
      });
    }

    // Create endorsement
    const { data: endorsement, error } = await supabase
      .from('endorsements')
      .insert({
        student_id,
        faculty_id,
        post_id,
        endorsement_text: endorsement_text || '',
        skills_endorsed: Array.isArray(skills_endorsed) ? skills_endorsed : [],
        rating: rating || null
      })
      .select(`
        *,
        student:profiles!student_id (
          name,
          role,
          department
        ),
        faculty:profiles!faculty_id (
          name,
          role,
          department
        ),
        post:posts!post_id (
          title,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Create endorsement error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create endorsement',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Endorsement created successfully',
      data: { endorsement }
    });
  } catch (error) {
    console.error('Create endorsement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get endorsements for a student
 */
const getStudentEndorsements = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: endorsements, error } = await supabase
      .from('endorsements')
      .select(`
        *,
        faculty:profiles!faculty_id (
          name,
          role,
          department,
          avatar_url
        ),
        post:posts!post_id (
          title,
          description,
          created_at
        )
      `)
      .eq('student_id', studentId)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get endorsements error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch endorsements',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        endorsements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: endorsements.length
        }
      }
    });
  } catch (error) {
    console.error('Get endorsements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createEndorsement,
  getStudentEndorsements
};