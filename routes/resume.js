const express = require('express');
const { generateResume, getResumeData } = require('../controllers/resumeController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/:studentId', verifyToken, generateResume);
router.get('/:studentId/data', verifyToken, getResumeData);

module.exports = router;