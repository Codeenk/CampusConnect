const { body, query, param, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Sanitize HTML to prevent XSS
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Apply sanitization middleware
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be student, faculty, or admin'),
  sanitizeBody,
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone_number')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('gpa')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('GPA must be between 0 and 10'),
  body('graduation_year')
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Graduation year must be between 2020 and 2050'),
  sanitizeBody,
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('receiverId')
    .isUUID()
    .withMessage('Receiver ID must be a valid UUID'),
  body('message')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  sanitizeBody,
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ID parameter validation
const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateProfileUpdate,
  validateMessage,
  validatePagination,
  validateUUID,
  sanitizeBody,
  handleValidationErrors
};