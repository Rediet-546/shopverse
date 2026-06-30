// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { body } = require('express-validator');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

// Validation rules
const chatValidation = [
  body('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
];

const recommendationValidation = [
  body('query')
    .notEmpty().withMessage('Query is required')
    .isLength({ min: 2, max: 100 }).withMessage('Query must be between 2 and 100 characters')
];

// AI Chat (Authenticated users)
router.post(
  '/chat',
  auth,
  rateLimiter({ windowMs: 60 * 1000, max: 20 }), // 20 requests per minute
  validate(chatValidation),
  catchAsync(aiController.chat)
);

// AI Chat (Public - for guests, with stricter limits)
router.post(
  '/chat/public',
  rateLimiter({ windowMs: 60 * 1000, max: 5 }), // 5 requests per minute
  validate(chatValidation),
  catchAsync(aiController.chat)
);

// Product Recommendations
router.post(
  '/recommend',
  auth,
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate(recommendationValidation),
  catchAsync(aiController.recommendProducts)
);

// Product Insights (Admin/Vendor only)
router.get(
  '/insights/:productId',
  auth,
  authorize([USER_ROLES.ADMIN, USER_ROLES.VENDOR]),
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  catchAsync(aiController.getProductInsights)
);

module.exports = router;