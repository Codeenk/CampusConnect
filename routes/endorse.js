const express = require('express');
const { body } = require('express-validator');
const {
  createEndorsement,
  getStudentEndorsements,
  getFacultyEndorsements,
  deleteEndorsement
} = require('../controllers/endorseController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const endorsementValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required'),
  body('endorsementText')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Endorsement text must be less than 1000 characters')
];

// Routes
router.post('/', auth, auth.requireFaculty, endorsementValidation, createEndorsement);
router.get('/student/:studentId', auth, getStudentEndorsements);
router.get('/faculty/my', auth, auth.requireFaculty, getFacultyEndorsements);
router.delete('/:endorsementId', auth, auth.requireFaculty, deleteEndorsement);

module.exports = router;