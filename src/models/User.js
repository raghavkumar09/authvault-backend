const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { len: [2, 100] },
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true, // null for Google OAuth users
    },
    avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false,
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        unique: true,
    },
    provider: {
        type: DataTypes.ENUM('local', 'google'),
        defaultValue: 'local',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'users',
    indexes: [
        { fields: ['role'] },
        { fields: ['google_id'] },
    ],
    // Never return password in default queries
    defaultScope: {
        attributes: {
            exclude: ['password', 'emailVerificationToken', 'emailVerificationExpires',
                'passwordResetToken', 'passwordResetExpires'],
        },
    },
    scopes: {
        withPassword: {
            attributes: { include: ['password'] },
        },
        withTokens: {
            attributes: {
                include: ['emailVerificationToken', 'emailVerificationExpires',
                    'passwordResetToken', 'passwordResetExpires']
            },
        },
        withAll: { attributes: {} },
    },
});

// Hash password before create/update
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12);
    }
});

// Instance method: verify password
User.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: get avatar URL
User.prototype.getAvatarUrl = function (serverUrl) {
    if (!this.avatar) return null;
    if (this.avatar.startsWith('http')) return this.avatar;
    return `${serverUrl}/uploads/avatars/${this.avatar}`;
};

module.exports = User;
