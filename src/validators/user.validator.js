const { body, query } = require('express-validator');

const updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),
];

const getUsersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),

    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Search term too long'),
];

const changeRoleValidator = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
];

module.exports = { updateProfileValidator, getUsersValidator, changeRoleValidator };
