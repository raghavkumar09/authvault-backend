const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),

    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').default(''),

    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().default(587),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASS: Joi.string().required(),
    EMAIL_FROM: Joi.string().required(),

    CLIENT_URL: Joi.string().default('http://localhost:5173'),
    SERVER_URL: Joi.string().default('http://localhost:5000'),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`❌ Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    db: {
        host: envVars.DB_HOST,
        port: envVars.DB_PORT,
        name: envVars.DB_NAME,
        user: envVars.DB_USER,
        password: envVars.DB_PASSWORD,
    },
    redis: {
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
        password: envVars.REDIS_PASSWORD,
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpiry: envVars.JWT_ACCESS_EXPIRY,
        refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
    },
    email: {
        host: envVars.EMAIL_HOST,
        port: envVars.EMAIL_PORT,
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASS,
        from: envVars.EMAIL_FROM,
    },
    clientUrl: envVars.CLIENT_URL,
    serverUrl: envVars.SERVER_URL,
};
