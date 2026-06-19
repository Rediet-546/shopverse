const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validate, validationRules } = require('../middleware/validator');
const { auth, authorize } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

// ============================================
// PUBLIC WEBHOOK ROUTE
// ============================================

/**
 * @route   POST /api/payment/webhook
 * @desc    Stripe webhook handler
 * @access  Public (but verified with signature)
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  catchAsync(paymentController.handleWebhook)
);

// ============================================
// PROTECTED PAYMENT ROUTES
// ============================================

router.use(auth);

/**
 * @route   POST /api/payment/create-intent
 * @desc    Create payment intent
 * @access  Private
 */
router.post(
  '/create-intent',
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate([
    validationRules.orderId()
  ]),
  catchAsync(paymentController.createPaymentIntent)
);

/**
 * @route   POST /api/payment/confirm
 * @desc    Confirm payment
 * @access  Private
 */
router.post(
  '/confirm',
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate([
    validationRules.paymentIntentId()
  ]),
  catchAsync(paymentController.confirmPayment)
);

/**
 * @route   POST /api/payment/refund
 * @desc    Refund payment
 * @access  Private
 */
router.post(
  '/refund',
  rateLimiter({ windowMs: 60 * 1000, max: 5 }),
  validate([
    validationRules.orderId()
  ]),
  catchAsync(paymentController.refundPayment)
);

/**
 * @route   GET /api/payment/methods
 * @desc    Get user's payment methods
 * @access  Private
 */
router.get(
  '/methods',
  catchAsync(paymentController.getPaymentMethods)
);

/**
 * @route   POST /api/payment/setup-method
 * @desc    Setup payment method
 * @access  Private
 */
router.post(
  '/setup-method',
  validate([
    validationRules.paymentMethodId()
  ]),
  catchAsync(paymentController.setupPaymentMethod)
);

/**
 * @route   GET /api/payment/history
 * @desc    Get payment history
 * @access  Private
 */
router.get(
  '/history',
  validate([
    validationRules.limit()
  ]),
  catchAsync(paymentController.getPaymentHistory)
);

// ============================================
// PAYPAL ROUTES
// ============================================

/**
 * @route   POST /api/payment/paypal/create
 * @desc    Create PayPal order
 * @access  Private
 */
router.post(
  '/paypal/create',
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate([
    validationRules.orderId()
  ]),
  catchAsync(paymentController.createPayPalOrder)
);

/**
 * @route   POST /api/payment/paypal/capture
 * @desc    Capture PayPal order
 * @access  Private
 */
router.post(
  '/paypal/capture',
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate([
    validationRules.orderId()
  ]),
  catchAsync(paymentController.capturePayPalOrder)
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/payment/balance
 * @desc    Get Stripe balance (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/balance',
  authorize([USER_ROLES.ADMIN]),
  catchAsync(paymentController.getBalance)
);

/**
 * @route   GET /api/payment/charges
 * @desc    Get Stripe charges (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/charges',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.limit()
  ]),
  catchAsync(paymentController.getCharges)
);

module.exports = router;