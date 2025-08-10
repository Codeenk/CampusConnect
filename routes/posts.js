const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentPost
} = require('../controllers/postController');
const { verifyToken, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      }
      return typeof value === 'string' && value.length <= 50;
    })
    .withMessage('Tags must be strings with max 50 characters each')
];

const commentValidation = [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// Routes
router.post('/create', verifyToken, requireStudent, postValidation, createPost);
router.get('/feed', verifyToken, getFeed);
router.get('/:postId', verifyToken, getPost);
router.put('/:postId', verifyToken, postValidation, updatePost);
router.delete('/:postId', verifyToken, deletePost);
router.post('/:postId/like', verifyToken, likePost);
router.post('/:postId/comment', verifyToken, commentValidation, commentPost);

module.exports = router;