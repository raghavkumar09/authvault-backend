const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get value from cache. Returns null if Redis is unavailable or key not found.
 */
const cacheGet = async (key) => {
    try {
        const redis = getRedis();
        if (!redis || redis.status !== 'ready') return null;

        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        logger.warn(`Cache GET error [${key}]: ${err.message}`);
        return null;
    }
};

/**
 * Set a value in cache with optional TTL (seconds)
 */
const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
    try {
        const redis = getRedis();
        if (!redis || redis.status !== 'ready') return false;

        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
    } catch (err) {
        logger.warn(`Cache SET error [${key}]: ${err.message}`);
        return false;
    }
};

/**
 * Delete a specific key
 */
const cacheDel = async (key) => {
    try {
        const redis = getRedis();
        if (!redis || redis.status !== 'ready') return false;

        await redis.del(key);
        return true;
    } catch (err) {
        logger.warn(`Cache DEL error [${key}]: ${err.message}`);
        return false;
    }
};

/**
 * Delete all keys matching a pattern (e.g., 'users:*')
 */
const cacheDelPattern = async (pattern) => {
    try {
        const redis = getRedis();
        if (!redis || redis.status !== 'ready') return false;

        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (err) {
        logger.warn(`Cache DEL PATTERN error [${pattern}]: ${err.message}`);
        return false;
    }
};

/**
 * Cache keys registry — centralized naming prevents typos
 */
const CACHE_KEYS = {
    userList: (page, limit, search) => `users:list:${page}:${limit}:${search || 'all'}`,
    userById: (id) => `users:${id}`,
    userPattern: () => 'users:*',
};

module.exports = { cacheGet, cacheSet, cacheDel, cacheDelPattern, CACHE_KEYS };
