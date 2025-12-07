const { body } = require('express-validator');

/**
 * Validation middleware for user registration
 */
exports.validateRegister = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * Validation middleware for user login
 */
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation middleware for user creation
 */
exports.validateUser = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('role_id')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Role ID must be 1 (User), 2 (Manager), or 3 (Admin)'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * Validation middleware for user update
 */
exports.validateUserUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('role_id')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Role ID must be 1 (User), 2 (Manager), or 3 (Admin)'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('status')
    .optional()
    .isIn(['active', 'locked']).withMessage('Status must be active or locked')
];

