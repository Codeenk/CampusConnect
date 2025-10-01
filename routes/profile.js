const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  getAllProfiles,
  getProfileById
} = require('../controllers/profileController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Major must be less than 100 characters'),
  body('year')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true
      const num = parseInt(value)
      return num >= 1 && num <= 10
    })
    .withMessage('Year must be a number between 1 and 10'),
  body('graduation_year')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true
      const num = parseInt(value)
      return num >= 2020 && num <= 2050
    })
    .withMessage('Graduation year must be between 2020 and 2050'),
  body('headline')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Headline must be less than 200 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('hometown')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Hometown must be less than 100 characters'),
  body('gpa')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true
      const num = parseFloat(value)
      return num >= 0.0 && num <= 4.0
    })
    .withMessage('GPA must be between 0.0 and 4.0'),
  body('minor')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Minor must be less than 100 characters'),
  body('student_id')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Student ID must be less than 50 characters'),
  body('phone_number')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('github_url')
    .optional()
    .custom((value) => {
      if (value && value !== '') {
        return /^https?:\/\/.+/.test(value)
      }
      return true
    })
    .withMessage('GitHub URL must be a valid URL'),
  body('linkedin_url')
    .optional()
    .custom((value) => {
      if (value && value !== '') {
        return /^https?:\/\/.+/.test(value)
      }
      return true
    })
    .withMessage('LinkedIn URL must be a valid URL'),
  body('portfolio_url')
    .optional()
    .custom((value) => {
      if (value && value !== '') {
        return /^https?:\/\/.+/.test(value)
      }
      return true
    })
    .withMessage('Portfolio URL must be a valid URL'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array'),
  body('experience')
    .optional()
    .isArray()
    .withMessage('Experience must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        for (const exp of value) {
          if (typeof exp !== 'object' || exp === null) {
            throw new Error('Each experience item must be an object');
          }
          if (exp.position && typeof exp.position !== 'string') {
            throw new Error('Experience position must be a string');
          }
          if (exp.company && typeof exp.company !== 'string') {
            throw new Error('Experience company must be a string');
          }
        }
      }
      return true;
    }),
  body('projects')
    .optional()
    .isArray()
    .withMessage('Projects must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        for (const proj of value) {
          if (typeof proj !== 'object' || proj === null) {
            throw new Error('Each project item must be an object');
          }
          if (proj.title && typeof proj.title !== 'string') {
            throw new Error('Project title must be a string');
          }
        }
      }
      return true;
    }),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        for (const cert of value) {
          if (typeof cert !== 'object' || cert === null) {
            throw new Error('Each certification item must be an object');
          }
          if (cert.name && typeof cert.name !== 'string') {
            throw new Error('Certification name must be a string');
          }
          if (cert.issuer && typeof cert.issuer !== 'string') {
            throw new Error('Certification issuer must be a string');
          }
        }
      }
      return true;
    }),
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array')
];

// Routes
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfileValidation, updateProfile);
router.get('/all', auth, getAllProfiles);
router.get('/:userId', auth, getProfileById);

module.exports = router;