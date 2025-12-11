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

/**
 * Validation middleware for favorite creation
 */
exports.validateFavorite = [
  body('station_id')
    .notEmpty().withMessage('Station ID is required')
    .isInt({ min: 1 }).withMessage('Station ID must be a positive integer')
];

/**
 * Validation middleware for admin user update (allows email, no password)
 * full_name, email and role_id are required for edit user modal
 */
exports.validateAdminUserUpdate = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('role_id')
    .notEmpty().withMessage('Role ID is required')
    .isInt({ min: 1, max: 2 }).withMessage('Role ID must be 1 (User) or 2 (Manager). Admin role cannot be assigned.'),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * Validation middleware for user status update
 */
exports.validateUserStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'locked']).withMessage('Status must be active or locked')
];

/**
 * Validation middleware for station creation
 */
exports.validateStation = [
  body('station_name')
    .trim()
    .notEmpty().withMessage('Station name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Station name must be between 1 and 100 characters'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 1, max: 255 }).withMessage('Address must be between 1 and 255 characters'),
  
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('price_per_kwh')
    .notEmpty().withMessage('Price per KWH is required')
    .isFloat({ min: 0 }).withMessage('Price per KWH must be greater than or equal to 0'),
  
  body('station_type')
    .notEmpty().withMessage('Station type is required')
    .isIn(['xe_may', 'oto', 'ca_hai']).withMessage('Station type must be xe_may, oto, or ca_hai'),
  
  body('total_slots')
    .notEmpty().withMessage('Total slots is required')
    .isInt({ min: 1 }).withMessage('Total slots must be at least 1'),
  
  body('charging_power')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Charging power must be greater than or equal to 0'),
  
  body('connector_types')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Connector types cannot exceed 100 characters'),
  
  body('opening_hours')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Opening hours cannot exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'inactive']).withMessage('Status must be active, maintenance, or inactive'),
  
  body('manager_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Manager ID must be a positive integer')
];

/**
 * Validation middleware for station update
 */
exports.validateStationUpdate = [
  body('station_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Station name must be between 1 and 100 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Address must be between 1 and 255 characters'),
  
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('price_per_kwh')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price per KWH must be greater than or equal to 0'),
  
  body('station_type')
    .optional()
    .isIn(['xe_may', 'oto', 'ca_hai']).withMessage('Station type must be xe_may, oto, or ca_hai'),
  
  body('total_slots')
    .optional()
    .isInt({ min: 1 }).withMessage('Total slots must be at least 1'),
  
  body('charging_power')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Charging power must be greater than or equal to 0'),
  
  body('connector_types')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Connector types cannot exceed 100 characters'),
  
  body('opening_hours')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Opening hours cannot exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'inactive']).withMessage('Status must be active, maintenance, or inactive'),
  
  body('manager_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Manager ID must be a positive integer')
];

