const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Central Express error handler
 * Must be registered LAST with app.use()
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert known library errors to ApiError
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
        error = ApiError.badRequest('Database validation failed', messages);
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        error = ApiError.badRequest('Related resource not found');
    }

    if (err.name === 'SequelizeDatabaseError') {
        error = ApiError.internal('Database error occurred');
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Invalid or expired token');
    }

    // Ensure we have a proper ApiError
    if (!(error instanceof ApiError)) {
        error = new ApiError(
            err.statusCode || 500,
            err.message || 'Something went wrong',
            [],
            err.stack
        );
    }

    // Log server errors
    if (error.statusCode >= 500) {
        logger.error({
            message: error.message,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id,
        });
    } else if (config.env === 'development') {
        logger.warn(`[${error.statusCode}] ${error.message} — ${req.method} ${req.originalUrl}`);
    }

    const response = {
        success: false,
        message: error.message,
        ...(error.errors?.length > 0 && { errors: error.errors }),
        ...(config.env === 'development' && { stack: error.stack }),
    };

    return res.status(error.statusCode).json(response);
};

/**
 * Catch all 404 errors
 */
const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route '${req.method} ${req.originalUrl}' not found`));
};

module.exports = { errorHandler, notFoundHandler };
