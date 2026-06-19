const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * Validate request based on validation rules
 */
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Execute all validations
      await Promise.all(validations.map(validation => validation.run(req)));
      
      // Get validation errors
      const errors = validationResult(req);
      
      if (errors.isEmpty()) {
        return next();
      }
      
      // Format errors
      const formattedErrors = errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }));
      
      logger.warn('Validation failed:', { errors: formattedErrors, path: req.path });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
      
    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  };
};

/**
 * Common validation rules
 */
const validationRules = {
  // User validations
  email: () => body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .trim(),
  
  password: () => body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
  
  firstName: () => body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name too long')
    .trim(),
  
  lastName: () => body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name too long')
    .trim(),
  
  phone: () => body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,15}$/).withMessage('Invalid phone number')
    .trim(),
  
  // Product validations
  productName: () => body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name too long')
    .trim(),
  
  productDescription: () => body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description too long')
    .trim(),
  
  price: () => body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be positive')
    .toFloat(),
  
  discount: () => body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
    .toFloat(),
  
  category: () => body('category')
    .notEmpty().withMessage('Category is required')
    .trim(),
  
  quantity: () => body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt(),
  
  // Order validations
  address: () => [
    body('shippingAddress.street')
      .notEmpty().withMessage('Street address is required')
      .trim(),
    body('shippingAddress.city')
      .notEmpty().withMessage('City is required')
      .trim(),
    body('shippingAddress.state')
      .notEmpty().withMessage('State is required')
      .trim(),
    body('shippingAddress.country')
      .notEmpty().withMessage('Country is required')
      .trim(),
    body('shippingAddress.zipCode')
      .notEmpty().withMessage('Zip code is required')
      .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code')
  ],
  
  // ID validation
  id: () => param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  // Pagination
  page: () => query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be greater than 0')
    .toInt(),
  
  limit: () => query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  // Status validation
  orderStatus: () => body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  
  // Payment
  paymentMethod: () => body('paymentMethod')
    .isIn(['card', 'paypal', 'cod', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  
  // Coupon
  couponCode: () => body('couponCode')
    .notEmpty().withMessage('Coupon code is required')
    .trim()
    .toUpperCase()
};

/**
 * Validate request body
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} is required`
        });
        continue;
      }
      
      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
      // Type validation
      if (rules.type) {
        const type = typeof value;
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an array`
          });
          continue;
        }
        if (rules.type !== 'array' && type !== rules.type) {
          errors.push({
            field,
            message: `${field} must be a ${rules.type}`
          });
          continue;
        }
      }
      
      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters`
          });
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must not exceed ${rules.maxLength} characters`
          });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            field,
            message: rules.patternMessage || `${field} format is invalid`
          });
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${rules.enum.join(', ')}`
          });
        }
      }
      
      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.min}`
          });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            field,
            message: `${field} must not exceed ${rules.max}`
          });
        }
      }
      
      // Array validations
      if (Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push({
            field,
            message: `${field} must have at least ${rules.minItems} items`
          });
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push({
            field,
            message: `${field} must not exceed ${rules.maxItems} items`
          });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  try {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
      }
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Trim and remove dangerous characters
          sanitized[key] = value
            .trim()
            .replace(/[<>]/g, '');
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };
    
    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);
    
    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    next(error);
  }
};

module.exports = {
  validate,
  validationRules,
  validateBody,
  sanitizeBody
};