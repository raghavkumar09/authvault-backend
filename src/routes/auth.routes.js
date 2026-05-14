const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiterMiddleware } = require('../middlewares/rateLimiter');
const { passport } = require('../config/passport');
const {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
} = require('../validators/auth.validator');

// Registration & Email Verification
router.post('/register', authLimiterMiddleware, validate(registerValidator), authController.register);
router.get('/verify-email/:token', authController.verifyEmail);

// Login / Logout / Token Refresh
router.post('/login', authLimiterMiddleware, validate(loginValidator), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Password Reset
router.post('/forgot-password', authLimiterMiddleware, validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidator), authController.resetPassword);

// Current User
router.get('/me', authenticate, authController.getMe);

module.exports = router;
