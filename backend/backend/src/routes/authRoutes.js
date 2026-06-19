const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, validationRules } = require('../middleware/validator');
const { auth } = require('../middleware/auth');
const { loginRateLimiter, strictRateLimiter } = require('../middleware/rateLimiter');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  strictRateLimiter,
  validate([
    validationRules.email(),
    validationRules.password(),
    validationRules.firstName(),
    validationRules.lastName()
  ]),
  catchAsync(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimiter,
  validate([
    validationRules.email(),
    validationRules.password()
  ]),
  catchAsync(authController.login)
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  strictRateLimiter,
  catchAsync(authController.refreshToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  auth,
  catchAsync(authController.logout)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  strictRateLimiter,
  validate([
    validationRules.email()
  ]),
  catchAsync(authController.forgotPassword)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  strictRateLimiter,
  validate([
    validationRules.password()
  ]),
  catchAsync(authController.resetPassword)
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get(
  '/verify-email/:token',
  catchAsync(authController.verifyEmail)
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
  '/resend-verification',
  strictRateLimiter,
  validate([
    validationRules.email()
  ]),
  catchAsync(authController.resendVerification)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post(
  '/change-password',
  auth,
  validate([
    validationRules.password()
  ]),
  catchAsync(authController.changePassword)
);

module.exports = router;