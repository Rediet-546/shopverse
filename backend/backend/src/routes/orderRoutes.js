const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validate, validationRules } = require('../middleware/validator');
const { auth, authorize } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

// ============================================
// ALL ORDER ROUTES ARE PROTECTED
// ============================================

router.use(auth);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post(
  '/',
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  validate([
    validationRules.address()
  ]),
  catchAsync(orderController.createOrder)
);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get(
  '/',
  validate([
    validationRules.page(),
    validationRules.limit()
  ]),
  catchAsync(orderController.getOrders)
);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private
 */
router.get(
  '/stats',
  catchAsync(orderController.getOrderStats)
);

/**
 * @route   GET /api/orders/vendor
 * @desc    Get vendor orders
 * @access  Private (Vendor/Admin)
 */
router.get(
  '/vendor',
  authorize([USER_ROLES.VENDOR, USER_ROLES.ADMIN]),
  validate([
    validationRules.page(),
    validationRules.limit()
  ]),
  catchAsync(orderController.getVendorOrders)
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate([
    validationRules.id('id')
  ]),
  catchAsync(orderController.getOrder)
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin/Vendor)
 */
router.put(
  '/:id/status',
  authorize([USER_ROLES.ADMIN, USER_ROLES.VENDOR]),
  validate([
    validationRules.id('id'),
    validationRules.orderStatus()
  ]),
  catchAsync(orderController.updateOrderStatus)
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.post(
  '/:id/cancel',
  validate([
    validationRules.id('id')
  ]),
  catchAsync(orderController.cancelOrder)
);

module.exports = router;