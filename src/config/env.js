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

    BREVO_API_KEY: Joi.string().required(),
    EMAIL_FROM: Joi.string().required(),

    GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
    GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
    GOOGLE_CALLBACK_URL: Joi.string().default('http://localhost:5000/api/auth/google/callback'),

    CLIENT_URL: Joi.string().default('http://localhost:5173'),
    SERVER_URL: Joi.string().default('http://localhost:5000'),

    CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
    CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
    CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
    CLOUDINARY_ENABLED: Joi.boolean().default(true),

}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
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
        apiKey: envVars.BREVO_API_KEY,
        from: envVars.EMAIL_FROM,
    },

    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        callbackUrl: envVars.GOOGLE_CALLBACK_URL,
    },
    clientUrl: envVars.CLIENT_URL,
    serverUrl: envVars.SERVER_URL,

    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET,
        enabled: envVars.CLOUDINARY_ENABLED,
    },
};
