const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getStatistics,
  exportStudentProfile,
  updateUserRole,
  deleteUser
} = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateRoleValidation = [
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be one of: student, faculty, admin')
];

// Routes - All admin routes require admin authentication
router.use(verifyToken, requireAdmin);

router.get('/users', getAllUsers);
router.get('/statistics', getStatistics);
router.get('/export/:studentId', exportStudentProfile);
router.put('/users/:userId/role', updateRoleValidation, updateUserRole);
router.delete('/users/:userId', deleteUser);

module.exports = router;