const { Op } = require('sequelize');
const { User } = require('../models');
const { generateSecureToken, hashToken, sanitizeUser } = require('../utils/helpers');
const { generateAccessToken, generateRefreshToken, revokeRefreshToken } = require('./token.service');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('./email.service');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

// Register
const register = async ({ name, email, password }) => {
    const existing = await User.scope('withAll').findOne({ where: { email } });
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const verificationToken = generateSecureToken(32);
    const tokenHash = hashToken(verificationToken);

    const user = await User.create({
        name,
        email,
        password,
        emailVerificationToken: tokenHash,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    try {
        await sendVerificationEmail(email, name, verificationToken);
    } catch (err) {
        logger.error(`Failed to send verification email to ${email}: ${err.message}`);
        // Don't fail registration if email fails — just log it
    }

    return sanitizeUser(user);
};

// Verify Email
const verifyEmail = async (token) => {
    const tokenHash = hashToken(token);

    const user = await User.scope('withTokens').findOne({
        where: {
            emailVerificationToken: tokenHash,
            emailVerificationExpires: { [Op.gt]: new Date() },
        },
    });

    if (!user) throw ApiError.badRequest('Invalid or expired verification link');
    if (user.isEmailVerified) throw ApiError.badRequest('Email already verified');

    await user.update({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
    });

    try {
        await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
        logger.warn(`Welcome email failed for ${user.email}: ${err.message}`);
    }

    return sanitizeUser(user);
};

// Login
const login = async (email, password, { userAgent, ipAddress } = {}) => {
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isEmailVerified) {
        throw ApiError.forbidden('Please verify your email address before logging in');
    }

    if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated. Contact support.');
    }

    await user.update({ lastLoginAt: new Date() });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id, { userAgent, ipAddress });

    return { accessToken, refreshToken, user: sanitizeUser(user) };
};

// Forgot Password
const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });

    // Always return success (don't reveal if email exists)
    if (!user || user.provider !== 'local') return;

    const resetToken = generateSecureToken(32);
    const tokenHash = hashToken(resetToken);

    await user.update({
        passwordResetToken: tokenHash,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1h
    });

    try {
        await sendPasswordResetEmail(email, user.name, resetToken);
    } catch (err) {
        // Roll back token if email fails
        await user.update({ passwordResetToken: null, passwordResetExpires: null });
        throw ApiError.internal('Failed to send reset email. Please try again.');
    }
};

// Reset Password
const resetPassword = async (token, newPassword) => {
    const tokenHash = hashToken(token);

    const user = await User.scope('withTokens').findOne({
        where: {
            passwordResetToken: tokenHash,
            passwordResetExpires: { [Op.gt]: new Date() },
        },
    });

    if (!user) throw ApiError.badRequest('Invalid or expired reset link');

    await user.update({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
    });

    return sanitizeUser(user);
};

// Logout
const logout = async (refreshToken) => {
    if (refreshToken) await revokeRefreshToken(refreshToken);
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, googleAuth, logout };
