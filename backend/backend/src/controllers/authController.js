const User = require('../models/User');
const Cart = require('../models/Cart');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { emailService } = require('../services/emailService');
const { cacheService } = require('../services/cacheService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        isVerified: false
      });

      await user.save();

      // Generate verification token
      const verifyToken = user.generateVerificationToken();
      await user.save({ validateBeforeSave: false });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email,
          verifyToken,
          user.firstName
        );
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Continue registration even if email fails
      }

      // Create cart for user
      await Cart.create({ userId: user._id });

      // Cache user
      await cacheService.setUser(user._id, {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in',
          requiresVerification: true
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const tokens = generateTokens(user);

      // Store refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save({ validateBeforeSave: false });

      // Cache user session
      await cacheService.setSession(user._id, {
        userId: user._id,
        email: user.email,
        role: user.role,
        lastActivity: Date.now()
      });

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Find user with refresh token
      const user = await User.findById(decoded.id).select('+refreshToken');
      
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Update refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save({ validateBeforeSave: false });

      logger.info(`Token refreshed for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user?.id;

      if (userId) {
        // Remove refresh token
        await User.findByIdAndUpdate(userId, { 
          refreshToken: null 
        });

        // Clear session cache
        await cacheService.deleteSession(userId);
      }

      logger.info(`User logged out: ${userId}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      // Hash token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with verification token
      const user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Verify user
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationExpire = undefined;
      await user.save();

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
      }

      logger.info(`User verified: ${user.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      const verifyToken = user.generateVerificationToken();
      await user.save({ validateBeforeSave: false });

      // Send verification email
      await emailService.sendVerificationEmail(
        user.email,
        verifyToken,
        user.firstName
      );

      logger.info(`Verification email resent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      logger.error('Resend verification error:', error);
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate reset token
      const resetToken = user.generateResetToken();
      await user.save({ validateBeforeSave: false });

      // Send reset email
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName
      );

      logger.info(`Password reset email sent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and password are required'
        });
      }

      // Hash token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with reset token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Clear all sessions
      await cacheService.deletePattern(`session:*:${user._id}`);

      logger.info(`Password reset for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      // Find user with password
      const user = await User.findById(userId).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Clear all sessions
      await cacheService.deletePattern(`session:*:${user._id}`);

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }
}

const authController = new AuthController();
module.exports = authController;