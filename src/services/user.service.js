const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { User } = require('../models');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern, CACHE_KEYS } = require('./cache.service');
const { buildPagination, parsePagination, sanitizeUser } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const { uploadOnCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// Get Users
const getUsers = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const search = query.search?.trim() || '';
    const cacheKey = CACHE_KEYS.userList(page, limit, search);

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

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
        // If avatar is not a full URL, it's local (legacy support or fallback)
        if (plain.avatar && !plain.avatar.startsWith('http')) {
            plain.avatar = `${config.serverUrl}/uploads/avatars/${plain.avatar}`;
        }
        return plain;
    });

    const pagination = buildPagination(page, limit, count);
    const result = { users, pagination };

    await cacheSet(cacheKey, result, 60); // cache 60 seconds
    return result;
};

// Get User By ID
const getUserById = async (id) => {
    const cacheKey = CACHE_KEYS.userById(id);
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

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

    await cacheSet(cacheKey, plain, 120);
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

    // delete cache
    await cacheDel(CACHE_KEYS.userById(userId));
    await cacheDelPattern(CACHE_KEYS.userPattern());

    return sanitizeUser(user);
};

// Upload Avatar
const uploadAvatar = async (userId, file) => {
    const user = await User.findByPk(userId);
    if (!user) {
        // If file was saved by diskStorage, clean it up
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw ApiError.notFound('User not found');
    }

    try {
        // Upload to Cloudinary or Local
        const result = await uploadOnCloudinary(file.path, 'avatars');
        
        if (!result) {
            throw ApiError.internal('Failed to upload image. Please try again later.');
        }

        // Delete old avatar if it was a Cloudinary URL
        // (This assumes we store the public_id or we can extract it, 
        // for simplicity let's just update the URL for now)
        // If you want to delete from Cloudinary, you'd need the public_id.
        // A better way is to store public_id in DB too.
        
        const oldAvatar = user.avatar;

        await user.update({ avatar: result.secure_url });

        // Delete old avatar if it was local
        if (oldAvatar && !oldAvatar.startsWith('http')) {
            const oldAvatarPath = path.join(process.cwd(), 'uploads/avatars', oldAvatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        } else if (oldAvatar && oldAvatar.startsWith('http') && oldAvatar.includes('cloudinary')) {
            // Optional: You could extract public_id and call deleteFromCloudinary
            // For now, we prioritize local cleanup as requested
        }

        // Bust cache
        await cacheDel(CACHE_KEYS.userById(userId));
        await cacheDelPattern(CACHE_KEYS.userPattern());

        // Return full URL for frontend to display immediately
        if (result.secure_url && !result.secure_url.startsWith('http')) {
            return `${config.serverUrl}/uploads/avatars/${result.secure_url}`;
        }

        return result.secure_url;
    } catch (error) {
        // Clean up local file on error
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw error;
    }
};

// Delete User (Admin)
const deleteUser = async (adminId, targetId) => {
    if (adminId === targetId) throw ApiError.badRequest('You cannot delete your own account');

    const user = await User.findByPk(targetId);
    if (!user) throw ApiError.notFound('User not found');

    // Delete avatar file if local
    if (user.avatar && !user.avatar.startsWith('http')) {
        const avatarPath = path.join(process.cwd(), 'uploads/avatars', user.avatar);
        if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    await user.destroy();

    await cacheDel(CACHE_KEYS.userById(targetId));
    await cacheDelPattern(CACHE_KEYS.userPattern());
};

// Change User Role (Admin)
const changeUserRole = async (adminId, targetId, role) => {
    if (adminId === targetId) throw ApiError.badRequest('You cannot change your own role');

    const user = await User.findByPk(targetId);
    if (!user) throw ApiError.notFound('User not found');

    await user.update({ role });

    await cacheDel(CACHE_KEYS.userById(targetId));
    await cacheDelPattern(CACHE_KEYS.userPattern());

    return sanitizeUser(user);
};

module.exports = { getUsers, getUserById, updateProfile, uploadAvatar, deleteUser, changeUserRole };
