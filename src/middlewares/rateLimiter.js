const { RateLimiterMemory } = require('rate-limiter-flexible');
const ApiError = require('../utils/ApiError');

/**
 * General API rate limiter: 100 requests per 15 minutes per IP
 */
const apiLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60,
});

/**
 * Strict limiter for auth endpoints: 5 attempts per 15 minutes per IP
 */
const authLimiter = new RateLimiterMemory({
    points: 5,
    duration: 15 * 60,
    blockDuration: 15 * 60,
});

const createRateLimitMiddleware = (limiter, message) => async (req, res, next) => {
    try {
        await limiter.consume(req.ip);
        next();
    } catch (rlRejected) {
        const retryAfter = Math.ceil(rlRejected.msBeforeNext / 1000);
        res.set('Retry-After', retryAfter);
        next(ApiError.tooMany(message || `Too many requests. Try again in ${retryAfter}s`));
    }
};

module.exports = {
    apiLimiterMiddleware: createRateLimitMiddleware(apiLimiter, 'Too many requests'),
    authLimiterMiddleware: createRateLimitMiddleware(
        authLimiter,
        'Too many login attempts. Please wait 15 minutes before trying again.'
    ),
};
