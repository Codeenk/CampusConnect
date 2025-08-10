const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  getAllProfiles,
  getProfileById
} = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

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
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('year')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Year must be a number between 1 and 10'),
  body('github_url')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array')
];

// Routes
router.get('/me', verifyToken, getProfile);
router.put('/update', verifyToken, updateProfileValidation, updateProfile);
router.get('/all', verifyToken, getAllProfiles);
router.get('/:userId', verifyToken, getProfileById);

module.exports = router;