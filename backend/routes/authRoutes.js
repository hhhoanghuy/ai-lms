const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password
router.put('/reset-password/:token', resetPassword);

module.exports = router;
