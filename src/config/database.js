const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('./logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: (msg) => {
        if (config.env === 'development') logger.debug(msg);
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('MySQL connected via Sequelize');

        // Sync all models (alter in dev, no-alter in prod)
        await sequelize.sync({ alter: config.env === 'development' });
        logger.info('Database synced');
    } catch (error) {
        logger.error(`Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
