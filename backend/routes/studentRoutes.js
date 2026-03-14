const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// @route   GET /api/students/find/:indexNumber
// @desc    Find student and room details
router.get('/find/:indexNumber', studentController.findStudentRoom);

// @route   POST /api/students/report-damage
// @desc    Report damage to assets
router.post('/report-damage', studentController.reportDamage);

module.exports = router;
