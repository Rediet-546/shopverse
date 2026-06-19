const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  try {
    // Log error
    logger.error('Error:', {
      message: err.message,
      stack: err.stack,
      status: err.status || 500,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id
    });

    // Default error response
    let errorResponse = {
      success: false,
      message: err.message || 'Internal server error',
      status: err.status || HTTP_STATUS.SERVER_ERROR,
      code: err.code || ERROR_CODES.SERVER_ERROR
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      errorResponse.status = HTTP_STATUS.BAD_REQUEST;
      errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
      errorResponse.errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      errorResponse.message = 'Validation error';
    }

    else if (err.name === 'CastError') {
      // Mongoose cast error (invalid ID)
      errorResponse.status = HTTP_STATUS.BAD_REQUEST;
      errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
      errorResponse.message = 'Invalid ID format';
    }

    else if (err.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      errorResponse.status = HTTP_STATUS.CONFLICT;
      errorResponse.code = ERROR_CODES.DUPLICATE_ERROR;
      errorResponse.message = `${field} already exists`;
      errorResponse.field = field;
    }

    else if (err.name === 'JsonWebTokenError') {
      // JWT error
      errorResponse.status = HTTP_STATUS.UNAUTHORIZED;
      errorResponse.code = ERROR_CODES.AUTHENTICATION_ERROR;
      errorResponse.message = 'Invalid token';
    }

    else if (err.name === 'TokenExpiredError') {
      // JWT expired
      errorResponse.status = HTTP_STATUS.UNAUTHORIZED;
      errorResponse.code = ERROR_CODES.AUTHENTICATION_ERROR;
      errorResponse.message = 'Token expired';
    }

    else if (err.message === 'Not authorized' || err.message === 'Invalid credentials') {
      errorResponse.status = HTTP_STATUS.UNAUTHORIZED;
      errorResponse.code = ERROR_CODES.AUTHENTICATION_ERROR;
    }

    else if (err.message.includes('permission')) {
      errorResponse.status = HTTP_STATUS.FORBIDDEN;
      errorResponse.code = ERROR_CODES.AUTHORIZATION_ERROR;
    }

    else if (err.message.includes('not found')) {
      errorResponse.status = HTTP_STATUS.NOT_FOUND;
      errorResponse.code = ERROR_CODES.NOT_FOUND;
    }

    // Rate limiting error
    else if (err.message.includes('rate limit') || err.message.includes('too many')) {
      errorResponse.status = HTTP_STATUS.TOO_MANY_REQUESTS;
      errorResponse.code = 'RATE_LIMIT_EXCEEDED';
      errorResponse.message = 'Too many requests. Please try again later.';
      errorResponse.retryAfter = err.retryAfter || 60;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
      errorResponse.details = err.details || null;
    }

    // Send response
    res.status(errorResponse.status).json(errorResponse);

  } catch (error) {
    // Fallback error handler
    logger.error('Error handler failed:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      status: 500
    });
  }
};

/**
 * Async wrapper to catch errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.status = statusCode;
    this.code = code || 'APP_ERROR';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  catchAsync,
  AppError
};