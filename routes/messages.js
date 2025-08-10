const express = require('express');
const { body } = require('express-validator');
const {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markAsRead
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const messageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
];

// Routes
router.post('/send', verifyToken, messageValidation, sendMessage);
router.get('/conversations', verifyToken, getConversations);
router.get('/conversation/:userId', verifyToken, getConversation);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/mark-read/:userId', verifyToken, markAsRead);

module.exports = router;