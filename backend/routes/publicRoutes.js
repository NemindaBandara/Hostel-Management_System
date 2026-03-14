const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// @route   GET /api/public/faculties
// @desc    Get all Faculties
router.get('/faculties', publicController.getAllFaculties);

module.exports = router;
