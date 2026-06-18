const validator = require('express-validator');
const logger = require('./logger');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate zip code
 */
const isValidZipCode = (zipCode) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

/**
 * Validate URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize input
 */
const sanitize = (input) => {
  if (!input) return input;
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove < >
      .trim();
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitize(item));
  }
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }
  return input;
};

/**
 * Validation rules
 */
const validationRules = {
  email: () => validator.body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),

  password: () => validator.body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  name: () => validator.body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  lastName: () => validator.body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  phone: () => validator.body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,15}$/)
    .withMessage('Please enter a valid phone number'),

  productName: () => validator.body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),

  price: () => validator.body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  quantity: () => validator.body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  category: () => validator.body('category')
    .notEmpty()
    .withMessage('Category is required'),

  address: () => [
    validator.body('street')
      .notEmpty()
      .withMessage('Street address is required'),
    validator.body('city')
      .notEmpty()
      .withMessage('City is required'),
    validator.body('state')
      .notEmpty()
      .withMessage('State is required'),
    validator.body('country')
      .notEmpty()
      .withMessage('Country is required'),
    validator.body('zipCode')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('Please enter a valid zip code')
  ]
};

/**
 * Validate request with multiple rules
 */
const validate = (rules) => {
  return async (req, res, next) => {
    try {
      await Promise.all(rules.map(rule => rule().run(req)));
      
      const errors = validator.validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }
      
      next();
    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  };
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  isValidZipCode,
  isValidUrl,
  sanitize,
  validationRules,
  validate
};