const express = require('express');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user notifications
router.get('/', auth, validatePagination, getNotifications);

// Get unread notification count
router.get('/unread-count', auth, getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read
router.patch('/read-all', auth, markAllAsRead);

module.exports = router;