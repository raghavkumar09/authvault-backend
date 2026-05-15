const Redis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

let redisClient = null;

const connectRedis = () => {
    redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,

        // Required for Upstash
        tls: {},

        maxRetriesPerRequest: 3,
        enableReadyCheck: true,

        retryStrategy: (times) => {
            if (times > 5) {
                logger.warn('Redis unavailable after 5 retries — caching disabled');
                return null;
            }

            return Math.min(times * 200, 2000);
        },
    });

    redisClient.on('connect', () => {
        logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
        logger.info('Redis ready');
    });

    redisClient.on('error', (err) => {
        logger.warn(`Redis error: ${err.message}`);
    });

    redisClient.on('close', () => {
        logger.warn('Redis connection closed');
    });

    return redisClient;
};

const getRedis = () => redisClient;

module.exports = { connectRedis, getRedis };