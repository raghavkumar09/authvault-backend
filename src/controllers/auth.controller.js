const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    path: '/',
};

// Register
const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        return new ApiResponse(201, 'Registration successful! Please check your email to verify your account.', user).send(res);
    } catch (err) { next(err); }
};

// Verify Email
const verifyEmail = async (req, res, next) => {
    try {
        const user = await authService.verifyEmail(req.params.token);
        return new ApiResponse(200, 'Email verified successfully! You can now log in.', user).send(res);
    } catch (err) { next(err); }
};

// Login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
        const { accessToken, refreshToken, user } = await authService.login(email, password, meta);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return new ApiResponse(200, 'Login successful', { accessToken, user }).send(res);
    } catch (err) { next(err); }
};

// Refresh Token
const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!token) throw ApiError.unauthorized('Refresh token not provided');

        const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
        const { accessToken, refreshToken: newRefreshToken, userId } = await tokenService.rotateRefreshToken(token, meta);

        res.cookie('refreshToken', newRefreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return new ApiResponse(200, 'Token refreshed', { accessToken }).send(res);
    } catch (err) {
        res.clearCookie('refreshToken');
        next(ApiError.unauthorized(err.message));
    }
};

// Logout
const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        await authService.logout(token);
        res.clearCookie('refreshToken');
        return new ApiResponse(200, 'Logged out successfully').send(res);
    } catch (err) { next(err); }
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        return new ApiResponse(200, 'If an account exists with this email, a reset link has been sent.').send(res);
    } catch (err) { next(err); }
};

// Reset Password
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        await authService.resetPassword(token, password);
        return new ApiResponse(200, 'Password reset successfully. Please log in with your new password.').send(res);
    } catch (err) { next(err); }
};

// Get Me
const getMe = async (req, res, next) => {
    try {
        const user = req.user.toJSON ? req.user.toJSON() : req.user;
        delete user.password;

        // Format avatar URL
        if (user.avatar && !user.avatar.startsWith('http')) {
            user.avatar = `${config.serverUrl}/uploads/avatars/${user.avatar}`;
        }

        return new ApiResponse(200, 'Profile fetched', user).send(res);
    } catch (err) { next(err); }
};

// Google OAuth Callback

const googleCallback = async (req, res, next) => {
    try {
        const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
        const { accessToken, refreshToken, user } = await authService.googleAuth(req.user, meta);

        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to frontend with access token in query (frontend stores it)
        return res.redirect(`${config.clientUrl}/oauth-callback?token=${accessToken}`);
    } catch (err) { next(err); }
};


module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword, getMe, googleCallback };
