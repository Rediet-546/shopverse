const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate access and refresh tokens for a user
 */
const generateTokens = (user) => {
  try {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Access token (short lived)
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '15m' }
    );

    // Refresh token (long lived)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Error generating tokens:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 */
const verifyToken = (token, secret) => {
  try {
    if (!token) {
      return null;
    }
    return jwt.verify(token, secret || process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
      return null;
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token');
      return null;
    }
    logger.error('Token verification error:', error);
    return null;
  }
};

/**
 * Decode JWT token without verification
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Generate password reset token
 */
const generateResetToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * Hash token for storage
 */
const hashToken = (token) => {
  return require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

module.exports = {
  generateTokens,
  verifyToken,
  decodeToken,
  generateResetToken,
  hashToken
};