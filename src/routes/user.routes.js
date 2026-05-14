const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadAvatar } = require('../middlewares/upload');
const { updateProfileValidator, getUsersValidator, changeRoleValidator } = require('../validators/user.validator');

// Public: paginated user list + single user profile
router.get('/', authenticate, validate(getUsersValidator), userController.getUsers);
router.get('/:id', authenticate, userController.getUserById);

// Authenticated: my profile
router.put('/profile', authenticate, validate(updateProfileValidator), userController.updateProfile);
router.post('/profile/avatar', authenticate, uploadAvatar, userController.uploadAvatar);

// Admin only
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);
router.patch('/:id/role', authenticate, authorize('admin'), validate(changeRoleValidator), userController.changeUserRole);

module.exports = router;
