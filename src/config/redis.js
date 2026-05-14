const Redis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

let redisClient = null;

const connectRedis = () => {
    const options = {
        host: config.redis.host,
        port: config.redis.port,
        ...(config.redis.password && { password: config.redis.password }),
        retryStrategy: (times) => {
            if (times > 5) {
                logger.warn('Redis unavailable after 5 retries — caching disabled');
                return null;
            }
            return Math.min(times * 200, 2000);
        },
        enableOfflineQueue: false,
        lazyConnect: true,
    };

    redisClient = new Redis(options);

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
    redisClient.on('close', () => logger.warn('Redis connection closed'));

    redisClient.connect().catch(() => {
        logger.warn('Redis connection failed — app will run without cache');
    });

    return redisClient;
};

const getRedis = () => redisClient;

module.exports = { connectRedis, getRedis };
