const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const { RefreshToken } = require('../models');
const { generateSecureToken, hashToken } = require('../utils/helpers');

// Generate Access Token
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { userId, role, jti: uuidv4() },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiry }
    );
};

// Generate Refresh Token
const generateRefreshToken = async (userId, { userAgent, ipAddress } = {}) => {
    const rawToken = generateSecureToken(64);
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
        tokenHash,
        userId,
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
    });

    return rawToken;
};

// Rotate Refresh Token
const rotateRefreshToken = async (rawToken, { userAgent, ipAddress } = {}) => {
    const tokenHash = hashToken(rawToken);

    const stored = await RefreshToken.findOne({ where: { tokenHash } });

    if (!stored || !stored.isValid()) {
        // Potential token reuse attack — revoke ALL tokens for this user
        if (stored) {
            await RefreshToken.update(
                { isRevoked: true },
                { where: { userId: stored.userId } }
            );
        }
        throw new Error('Invalid or expired refresh token');
    }

    // Revoke used token
    await stored.update({ isRevoked: true });

    const userId = stored.userId;
    const newAccessToken = generateAccessToken(userId, stored.user?.role || 'user');
    const newRefreshToken = await generateRefreshToken(userId, { userAgent, ipAddress });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, userId };
};

// Revoke Refresh Token
const revokeRefreshToken = async (rawToken) => {
    const tokenHash = hashToken(rawToken);
    await RefreshToken.update({ isRevoked: true }, { where: { tokenHash } });
};

// Revoke All User Tokens
const revokeAllUserTokens = async (userId) => {
    await RefreshToken.update({ isRevoked: true }, { where: { userId } });
};

// Purge Expired Tokens
const purgeExpiredTokens = async () => {
    const { Op } = require('sequelize');
    const deleted = await RefreshToken.destroy({
        where: { expiresAt: { [Op.lt]: new Date() } },
    });
    return deleted;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    purgeExpiredTokens,
};
