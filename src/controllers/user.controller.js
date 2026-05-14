const userService = require('../services/user.service');
const ApiResponse = require('../utils/ApiResponse');

// Get Users (paginated + search)
const getUsers = async (req, res, next) => {
    try {
        const { users, pagination } = await userService.getUsers(req.query);
        return new ApiResponse(200, 'Users fetched successfully', users, pagination).send(res);
    } catch (err) { next(err); }
};

// Get User By ID
const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        return new ApiResponse(200, 'User fetched successfully', user).send(res);
    } catch (err) { next(err); }
};

// Update My Profile
const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        return new ApiResponse(200, 'Profile updated successfully', user).send(res);
    } catch (err) { next(err); }
};

// Upload Avatar

const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            const { ApiError } = require('../utils/ApiError');
            throw ApiError.badRequest('No image file provided');
        }
        const avatarUrl = await userService.uploadAvatar(req.user.id, req.file);
        return new ApiResponse(200, 'Avatar uploaded successfully', { avatarUrl }).send(res);
    } catch (err) { next(err); }
};

// Delete User (Admin)

const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.user.id, req.params.id);
        return new ApiResponse(200, 'User deleted successfully').send(res);
    } catch (err) { next(err); }
};

// Change User Role (Admin)

const changeUserRole = async (req, res, next) => {
    try {
        const user = await userService.changeUserRole(req.user.id, req.params.id, req.body.role);
        return new ApiResponse(200, `User role updated to '${req.body.role}'`, user).send(res);
    } catch (err) { next(err); }
};

module.exports = { getUsers, getUserById, updateProfile, uploadAvatar, deleteUser, changeUserRole };
