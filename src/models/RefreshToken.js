const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Stores hashed token (SHA-256) — never the raw token
    tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'refresh_tokens',
    indexes: [
        { fields: ['token_hash'] },
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
    ],
});

// Class method: is token expired?
RefreshToken.prototype.isExpired = function () {
    return new Date() > this.expiresAt;
};

// Class method: is token valid (not revoked + not expired)?
RefreshToken.prototype.isValid = function () {
    return !this.isRevoked && !this.isExpired();
};

module.exports = RefreshToken;
