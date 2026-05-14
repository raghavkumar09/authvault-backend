const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AuthVault API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Mount feature routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
