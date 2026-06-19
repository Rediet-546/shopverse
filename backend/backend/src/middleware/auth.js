const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { cacheService } = require('../services/cacheService');
const logger = require('../utils/logger');
const { USER_ROLES } = require('../utils/constants');

/**
 * Authentication middleware - Verifies JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Check if token is in cache (blacklist)
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -resetPasswordToken -verificationToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before continuing.',
        requiresVerification: true
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      isActive: user.isActive
    };

    // Update last activity in cache
    await cacheService.setSession(user._id, {
      userId: user._id,
      email: user.email,
      role: user.role,
      lastActivity: Date.now()
    }, 900); // 15 minutes

    logger.debug(`User authenticated: ${user.email}`);
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Authorization middleware - Checks user roles
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // If no roles specified, allow all authenticated users
      if (roles.length === 0) {
        return next();
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by ${req.user.email} for ${req.user.role}`);
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.',
          requiredRoles: roles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed. Please try again.'
      });
    }
  };
};

/**
 * Check if user owns the resource
 * @param {Function} getResourceId - Function to get resource ID from request
 */
const checkOwnership = (getResourceId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = getResourceId(req);

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.'
        });
      }

      // Check if user is admin (admin can access all resources)
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      // Get the resource and check ownership
      const Model = require('../models/User');
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      if (resource.userId && resource.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Ownership verification failed.'
      });
    }
  };
};

/**
 * Optional authentication - Doesn't require token but uses if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id)
          .select('-password -refreshToken');
        
        if (user && user.isActive && user.isVerified) {
          req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          };
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Generate token blacklist (for logout)
 */
const blacklistToken = async (token) => {
  try {
    const decoded = verifyToken(token);
    if (decoded) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await cacheService.set(`blacklist:${token}`, true, expiresIn);
        logger.debug(`Token blacklisted: ${token.substring(0, 20)}...`);
      }
    }
  } catch (error) {
    logger.error('Token blacklist error:', error);
  }
};

module.exports = {
  auth,
  authorize,
  checkOwnership,
  optionalAuth,
  blacklistToken
};