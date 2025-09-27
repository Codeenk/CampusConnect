const express = require('express');
const { generateResume, getResumeData } = require('../controllers/resumeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/:studentId', auth, generateResume);
router.get('/:studentId/data', auth, getResumeData);

module.exports = router;