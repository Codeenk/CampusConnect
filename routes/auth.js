const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Validation middleware
const validateRegistration = (req, res, next) => {
  const { fullName, email, password, role } = req.body;
  
  // Check required fields
  if (!fullName?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required'
    });
  }
  
  if (!email?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  // Validate role
  const validRoles = ['student', 'faculty', 'admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified'
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  next();
};

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'authentication',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;