const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * Create endorsement for a student's project
 */
const createEndorsement = async (req, res) => {
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

    const { studentId, projectId, endorsementText = '' } = req.body;
    const facultyId = req.user.id;

    // Verify that the faculty member is actually faculty
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty members can create endorsements'
      });
    }

    // Verify that the student exists and has the student role
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Verify that the project exists and belongs to the student
    const { data: project, error: projectError } = await supabase
      .from('posts')
      .select('created_by')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.created_by !== studentId) {
      return res.status(400).json({
        success: false,
        message: 'Project does not belong to the specified student'
      });
    }

    // Check if endorsement already exists
    const { data: existingEndorsement } = await supabase
      .from('endorsements')
      .select('id')
      .eq('student_id', studentId)
      .eq('faculty_id', facultyId)
      .eq('project_id', projectId)
      .single();

    if (existingEndorsement) {
      return res.status(400).json({
        success: false,
        message: 'You have already endorsed this project'
      });
    }

    // Create endorsement
    const { data: endorsement, error } = await supabase
      .from('endorsements')
      .insert({
        student_id: studentId,
        faculty_id: facultyId,
        project_id: projectId,
        endorsement_text: endorsementText
      })
      .select(`
        *,
        faculty:profiles!faculty_id (
          name,
          department
        ),
        project:posts!project_id (
          title,
          description
        ),
        student:profiles!student_id (
          name,
          department
        )
      `)
      .single();

    if (error) {
      console.error('Endorsement creation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create endorsement',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Endorsement created successfully',
      data: {
        endorsement
      }
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

    const { data: endorsements, error } = await supabase
      .from('endorsements')
      .select(`
        *,
        faculty:profiles!faculty_id (
          name,
          department,
          role
        ),
        project:posts!project_id (
          title,
          description,
          tags
        )
      `)
      .eq('student_id', studentId)
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
        endorsements
      }
    });
  } catch (error) {
    console.error('Get student endorsements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get endorsements created by faculty
 */
const getFacultyEndorsements = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const { data: endorsements, error } = await supabase
      .from('endorsements')
      .select(`
        *,
        student:profiles!student_id (
          name,
          department,
          year
        ),
        project:posts!project_id (
          title,
          description,
          tags
        )
      `)
      .eq('faculty_id', facultyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get faculty endorsements error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch endorsements',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        endorsements
      }
    });
  } catch (error) {
    console.error('Get faculty endorsements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete endorsement (only by the faculty who created it)
 */
const deleteEndorsement = async (req, res) => {
  try {
    const { endorsementId } = req.params;
    const facultyId = req.user.id;

    const { error } = await supabase
      .from('endorsements')
      .delete()
      .eq('id', endorsementId)
      .eq('faculty_id', facultyId);

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Endorsement not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Endorsement deleted successfully'
    });
  } catch (error) {
    console.error('Delete endorsement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createEndorsement,
  getStudentEndorsements,
  getFacultyEndorsements,
  deleteEndorsement
};