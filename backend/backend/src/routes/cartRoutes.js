const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { validate, validationRules } = require('../middleware/validator');
const { auth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');

// ============================================
// ALL CART ROUTES ARE PROTECTED
// ============================================

router.use(auth);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
  '/',
  catchAsync(cartController.getCart)
);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/add',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  validate([
    validationRules.productId(),
    validationRules.quantity()
  ]),
  catchAsync(cartController.addToCart)
);

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
  '/update',
  validate([
    validationRules.productId(),
    validationRules.quantity()
  ]),
  catchAsync(cartController.updateCartItem)
);

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/remove/:productId',
  validate([
    validationRules.id('productId')
  ]),
  catchAsync(cartController.removeFromCart)
);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete(
  '/clear',
  catchAsync(cartController.clearCart)
);

/**
 * @route   POST /api/cart/coupon
 * @desc    Apply coupon to cart
 * @access  Private
 */
router.post(
  '/coupon',
  validate([
    validationRules.couponCode()
  ]),
  catchAsync(cartController.applyCoupon)
);

/**
 * @route   DELETE /api/cart/coupon
 * @desc    Remove coupon from cart
 * @access  Private
 */
router.delete(
  '/coupon',
  catchAsync(cartController.removeCoupon)
);

module.exports = router;