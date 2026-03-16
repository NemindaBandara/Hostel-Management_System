const express = require('express');
const router = express.Router();
const { login, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
