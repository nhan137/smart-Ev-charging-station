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

/**
 * Validation middleware for booking creation
 */
exports.validateBooking = [
  body('station_id')
    .notEmpty().withMessage('Station ID is required')
    .isInt({ min: 1 }).withMessage('Station ID must be a positive integer'),
  
  body('vehicle_type')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['xe_may_usb', 'xe_may_ccs', 'oto_ccs']).withMessage('Invalid vehicle type. Allowed: xe_may_usb, xe_may_ccs, oto_ccs'),
  
  body('start_time')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Start time must be a valid datetime (ISO 8601 format)'),
  
  body('end_time')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('End time must be a valid datetime (ISO 8601 format)'),
  
  body('promo_code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Promo code must be between 1 and 50 characters')
];

/**
 * Validation middleware for forgot password
 */
exports.validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

/**
 * Validation middleware for reset password
 * Accepts both 'password' and 'newPassword' fields
 */
exports.validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  
  // Validate password field (if provided)
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  // Validate newPassword field (if provided)
  body('newPassword')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  // Custom validation: at least one password field must be provided
  body().custom((value, { req }) => {
    if (!value.password && !value.newPassword) {
      throw new Error('Password or newPassword is required');
    }
    return true;
  })
];

/**
 * Validation middleware for feedback creation
 */
exports.validateFeedback = [
  body('station_id')
    .notEmpty().withMessage('Station ID is required')
    .isInt({ min: 1 }).withMessage('Station ID must be a positive integer'),
  
  body('booking_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Booking ID must be a positive integer'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
];

