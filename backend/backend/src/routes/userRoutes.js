const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, validationRules } = require('../middleware/validator');
const { auth, authorize } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

// ============================================
// ALL USER ROUTES ARE PROTECTED
// ============================================

router.use(auth);

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  catchAsync(userController.getProfile)
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  catchAsync(userController.updateProfile)
);

// ============================================
// ADDRESS ROUTES
// ============================================

/**
 * @route   GET /api/users/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get(
  '/addresses',
  catchAsync(userController.getAddresses)
);

/**
 * @route   POST /api/users/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post(
  '/addresses',
  validate(validationRules.address()),
  catchAsync(userController.addAddress)
);

/**
 * @route   PUT /api/users/addresses/:addressId
 * @desc    Update address
 * @access  Private
 */
router.put(
  '/addresses/:addressId',
  validate([
    validationRules.id('addressId')
  ]),
  catchAsync(userController.updateAddress)
);

/**
 * @route   DELETE /api/users/addresses/:addressId
 * @desc    Delete address
 * @access  Private
 */
router.delete(
  '/addresses/:addressId',
  validate([
    validationRules.id('addressId')
  ]),
  catchAsync(userController.deleteAddress)
);

// ============================================
// ORDER ROUTES (User specific)
// ============================================

/**
 * @route   GET /api/users/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get(
  '/orders',
  validate([
    validationRules.page(),
    validationRules.limit()
  ]),
  catchAsync(userController.getUserOrders)
);

// ============================================
// WISHLIST ROUTES
// ============================================

/**
 * @route   GET /api/users/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get(
  '/wishlist',
  catchAsync(userController.getWishlist)
);

/**
 * @route   POST /api/users/wishlist
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post(
  '/wishlist',
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  validate([
    validationRules.productId()
  ]),
  catchAsync(userController.addToWishlist)
);

/**
 * @route   DELETE /api/users/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete(
  '/wishlist/:productId',
  validate([
    validationRules.id('productId')
  ]),
  catchAsync(userController.removeFromWishlist)
);

// ============================================
// PUSH NOTIFICATION
// ============================================

/**
 * @route   POST /api/users/push-token
 * @desc    Update push notification token
 * @access  Private
 */
router.post(
  '/push-token',
  validate([
    validationRules.pushToken()
  ]),
  catchAsync(userController.updatePushToken)
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.page(),
    validationRules.limit()
  ]),
  catchAsync(userController.getAllUsers)
);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/:userId',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.id('userId')
  ]),
  catchAsync(userController.getUserById)
);

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Update user role (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:userId/role',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.id('userId'),
    validationRules.role()
  ]),
  catchAsync(userController.updateUserRole)
);

/**
 * @route   PUT /api/users/:userId/status
 * @desc    Toggle user status (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:userId/status',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.id('userId')
  ]),
  catchAsync(userController.toggleUserStatus)
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  '/:userId',
  authorize([USER_ROLES.ADMIN]),
  validate([
    validationRules.id('userId')
  ]),
  catchAsync(userController.deleteUser)
);

module.exports = router;