const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware to verify JWT token and attach user data to request
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (error || !profile) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Attach user data to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: profile.role,
      profile: profile
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is faculty or admin
 */
const requireFaculty = requireRole(['faculty', 'admin']);

/**
 * Middleware to check if user is student, faculty, or admin
 */
const requireStudent = requireRole(['student', 'faculty', 'admin']);

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireFaculty,
  requireStudent
};