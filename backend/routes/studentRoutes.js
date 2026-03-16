const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/students/find/:indexNumber
// @desc    Find student and room details
router.get('/find/:indexNumber', protect, studentController.findStudentRoom);

// @route   POST /api/students/report-damage
// @desc    Report damage to assets
router.post('/report-damage', protect, studentController.reportDamage);

module.exports = router;
