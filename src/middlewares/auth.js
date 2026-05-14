const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

/**
 * Verify JWT access token from Authorization header or cookie
 */
const authenticate = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw ApiError.unauthorized('No access token provided');
        }

        const decoded = jwt.verify(token, config.jwt.accessSecret);

        const user = await User.findByPk(decoded.userId);
        if (!user) throw ApiError.unauthorized('User no longer exists');
        if (!user.isActive) throw ApiError.forbidden('Account has been deactivated');

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(ApiError.unauthorized('Access token expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(ApiError.unauthorized('Invalid access token'));
        }
        next(error);
    }
};

/**
 * RBAC — restrict access to specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }
        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden(
                `Role '${req.user.role}' is not permitted to access this resource`
            ));
        }
        next();
    };
};

module.exports = { authenticate, authorize };
