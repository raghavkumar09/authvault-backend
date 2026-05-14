require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initPassport, passport } = require('./src/config/passport');
const routes = require('./src/routes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');
const { apiLimiterMiddleware } = require('./src/middlewares/rateLimiter');
const { purgeExpiredTokens } = require('./src/services/token.service');

// Load models (registers associations)
require('./src/models');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded images
}));

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Parsing ───────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── HTTP Logging ──────────────────────────────────────────────────────────

app.use(morgan(config.env === 'development' ? 'dev' : 'combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Passport (OAuth) ──────────────────────────────────────────────────────

initPassport();
app.use(passport.initialize());

// ─── Static Uploads ────────────────────────────────────────────────────────

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Rate Limiting ─────────────────────────────────────────────────────────

app.use('/api', apiLimiterMiddleware);

// ─── API Routes ────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── 404 + Global Error Handler ───────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Scheduled Jobs ───────────────────────────────────────────────────────

const scheduleCleanup = () => {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours
  setInterval(async () => {
    try {
      const deleted = await purgeExpiredTokens();
      if (deleted > 0) logger.info(`🧹 Purged ${deleted} expired refresh tokens`);
    } catch (err) {
      logger.warn(`Token cleanup failed: ${err.message}`);
    }
  }, INTERVAL_MS);
};

// ─── Bootstrap ─────────────────────────────────────────────────────────────

const bootstrap = async () => {
  try {
    // Connect to databases
    await connectDB();
    connectRedis();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 AuthVault server running on http://localhost:${config.port}`);
      logger.info(`📡 Environment: ${config.env}`);
    });

    // Start scheduled cleanup
    scheduleCleanup();

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`\n${signal} received — shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000); // Force exit after 10s
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

bootstrap();
