const winston = require('winston');
const path = require('path');
const config = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                consoleFormat,
            ),
        }),
        // File transport — errors only
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            format: combine(timestamp(), json()),
        }),
        // File transport — all logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            format: combine(timestamp(), json()),
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log'),
        }),
    ],
});

module.exports = logger;
