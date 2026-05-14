const crypto = require('crypto');

const generateSecureToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
};


const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const buildPagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

const sanitizeUser = (user) => {
    const plain = user.toJSON ? user.toJSON() : { ...user };
    delete plain.password;
    delete plain.emailVerificationToken;
    delete plain.passwordResetToken;
    delete plain.passwordResetExpires;
    return plain;
};

/**
 * Parse pagination params from query with safe defaults
 */
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

module.exports = {
    generateSecureToken,
    hashToken,
    buildPagination,
    sanitizeUser,
    parsePagination,
};
