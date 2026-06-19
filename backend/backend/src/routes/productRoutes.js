const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validate, validationRules } = require('../middleware/validator');
const { auth, authorize } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get(
  '/',
  rateLimiter({ windowMs: 60 * 1000, max: 100 }),
  catchAsync(productController.getProducts)
);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get(
  '/featured',
  catchAsync(productController.getFeaturedProducts)
);

/**
 * @route   GET /api/products/popular
 * @desc    Get popular products
 * @access  Public
 */
router.get(
  '/popular',
  catchAsync(productController.getPopularProducts)
);

/**
 * @route   GET /api/products/categories
 * @desc    Get all categories with counts
 * @access  Public
 */
router.get(
  '/categories',
  catchAsync(productController.getCategories)
);

/**
 * @route   GET /api/products/vendor/:vendorId
 * @desc    Get products by vendor
 * @access  Public
 */
router.get(
  '/vendor/:vendorId',
  validate([
    validationRules.id('vendorId')
  ]),
  catchAsync(productController.getProductsByVendor)
);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get(
  '/:id',
  rateLimiter({ windowMs: 60 * 1000, max: 100 }),
  validate([
    validationRules.id('id')
  ]),
  catchAsync(productController.getProduct)
);

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Get product reviews
 * @access  Public
 */
router.get(
  '/:id/reviews',
  validate([
    validationRules.id('id')
  ]),
  catchAsync(productController.getProductReviews)
);

// ============================================
// PROTECTED ROUTES (Admin & Vendor only)
// ============================================

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin/Vendor)
 */
router.post(
  '/',
  auth,
  authorize([USER_ROLES.ADMIN, USER_ROLES.VENDOR]),
  validate([
    validationRules.productName(),
    validationRules.productDescription(),
    validationRules.price(),
    validationRules.category()
  ]),
  catchAsync(productController.createProduct)
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Admin/Vendor)
 */
router.put(
  '/:id',
  auth,
  authorize([USER_ROLES.ADMIN, USER_ROLES.VENDOR]),
  validate([
    validationRules.id('id')
  ]),
  catchAsync(productController.updateProduct)
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete)
 * @access  Private (Admin/Vendor)
 */
router.delete(
  '/:id',
  auth,
  authorize([USER_ROLES.ADMIN, USER_ROLES.VENDOR]),
  validate([
    validationRules.id('id')
  ]),
  catchAsync(productController.deleteProduct)
);

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Add review to product
 * @access  Private
 */
router.post(
  '/:id/reviews',
  auth,
  validate([
    validationRules.id('id'),
    validationRules.rating()
  ]),
  catchAsync(productController.addReview)
);

module.exports = router;