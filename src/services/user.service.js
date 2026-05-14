const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { User } = require('../models');
const { buildPagination, parsePagination, sanitizeUser } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

// Get Users
const getUsers = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const search = query.search?.trim() || '';

    const where = {};
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
        ];
    }

    const { count, rows } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['password', 'emailVerificationToken', 'emailVerificationExpires',
                'passwordResetToken', 'passwordResetExpires', 'googleId']
        },
    });

    const users = rows.map((u) => {
        const plain = u.toJSON();
        if (plain.avatar && !plain.avatar.startsWith('http')) {
            plain.avatar = `${config.serverUrl}/uploads/avatars/${plain.avatar}`;
        }
        return plain;
    });

    const pagination = buildPagination(page, limit, count);
    const result = { users, pagination };

    return result;
};

// Get User By ID
const getUserById = async (id) => {

    const user = await User.findByPk(id, {
        attributes: {
            exclude: ['password', 'emailVerificationToken', 'emailVerificationExpires',
                'passwordResetToken', 'passwordResetExpires']
        },
    });

    if (!user) throw ApiError.notFound('User not found');

    const plain = user.toJSON();
    if (plain.avatar && !plain.avatar.startsWith('http')) {
        plain.avatar = `${config.serverUrl}/uploads/avatars/${plain.avatar}`;
    }

    return plain;
};

// Update Profile
const updateProfile = async (userId, updates) => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound('User not found');

    const allowedFields = ['name', 'bio', 'phone'];
    const filtered = Object.keys(updates)
        .filter((k) => allowedFields.includes(k))
        .reduce((obj, k) => ({ ...obj, [k]: updates[k] }), {});

    await user.update(filtered);

    return sanitizeUser(user);
};

// Upload Avatar
const uploadAvatar = async (userId, file) => {
    const user = await User.findByPk(userId);
    if (!user) throw ApiError.notFound('User not found');

    const filename = `${userId}-${Date.now()}.webp`;
    const uploadPath = path.join(__dirname, '../../uploads/avatars', filename);

    // Delete old avatar file if it exists locally
    if (user.avatar && !user.avatar.startsWith('http')) {
        const oldPath = path.join(__dirname, '../../uploads/avatars', user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Resize + convert to WebP
    await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toFile(uploadPath);

    await user.update({ avatar: filename });

    return `${config.serverUrl}/uploads/avatars/${filename}`;
};

// Delete User (Admin)
const deleteUser = async (adminId, targetId) => {
    if (adminId === targetId) throw ApiError.badRequest('You cannot delete your own account');

    const user = await User.findByPk(targetId);
    if (!user) throw ApiError.notFound('User not found');

    // Delete avatar file if local
    if (user.avatar && !user.avatar.startsWith('http')) {
        const avatarPath = path.join(__dirname, '../../uploads/avatars', user.avatar);
        if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    await user.destroy();
};

// Change User Role (Admin)
const changeUserRole = async (adminId, targetId, role) => {
    if (adminId === targetId) throw ApiError.badRequest('You cannot change your own role');

    const user = await User.findByPk(targetId);
    if (!user) throw ApiError.notFound('User not found');

    await user.update({ role });

    return sanitizeUser(user);
};

module.exports = { getUsers, getUserById, updateProfile, uploadAvatar, deleteUser, changeUserRole };
