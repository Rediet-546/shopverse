const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../utils/logger');
const { getClientIP } = require('../utils/helpers');

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.cloudinary.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'same-origin'
  },
  xssFilter: true,
  frameguard: {
    action: 'deny'
  },
  hidePoweredBy: true,
  ieNoOpen: true,
  noCache: process.env.NODE_ENV === 'production'
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:5000'];
    
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

const corsMiddleware = cors(corsOptions);

/**
 * XSS Protection - Sanitize request body
 */
const xssProtection = (req, res, next) => {
  try {
    if (req.body) {
      // Sanitize all string values in body
      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Use xss library for better protection
            sanitized[key] = xss(value, {
              whiteList: {}, // No HTML tags allowed
              stripIgnoreTag: true,
              stripIgnoreTagBody: ['script', 'style']
            });
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      const sanitizeQuery = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = xss(value, {
              whiteList: {},
              stripIgnoreTag: true,
              stripIgnoreTagBody: ['script', 'style']
            });
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.query = sanitizeQuery(req.query);
    }
    
    if (req.params) {
      const sanitizeParams = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = xss(value, {
              whiteList: {},
              stripIgnoreTag: true,
              stripIgnoreTagBody: ['script', 'style']
            });
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.params = sanitizeParams(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('XSS Protection error:', error);
    next(error);
  }
};

/**
 * SQL Injection Protection (for MongoDB)
 */
const sqlInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key, req, operation }) => {
    logger.debug(`Sanitized ${operation} parameter: ${key}`);
  }
});

/**
 * CSRF Protection
 */
const csrfProtection = (req, res, next) => {
  try {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip for webhooks and public endpoints
    if (req.path.includes('/webhook')) {
      return next();
    }
    
    // Get token from header
    const token = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    
    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token validation failed'
      });
    }
    
    next();
  } catch (error) {
    logger.error('CSRF Protection error:', error);
    next(error);
  }
};

/**
 * Request validation - Check for suspicious patterns
 */
const requestValidation = (req, res, next) => {
  try {
    // Check for suspicious query parameters
    const suspicious = ['$', 'eval', 'constructor', 'prototype'];
    const checkParams = (params) => {
      for (const key of Object.keys(params)) {
        if (suspicious.some(s => key.includes(s))) {
          logger.warn(`Suspicious parameter detected: ${key}`);
          return false;
        }
        const value = params[key];
        if (typeof value === 'string' && suspicious.some(s => value.includes(s))) {
          logger.warn(`Suspicious value detected in ${key}: ${value}`);
          return false;
        }
        if (typeof value === 'object') {
          return checkParams(value);
        }
      }
      return true;
    };
    
    // Check query, body, and params
    if (!checkParams(req.query)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters'
      });
    }
    
    if (req.body && !checkParams(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Request validation error:', error);
    next(error);
  }
};

/**
 * IP whitelist/blacklist
 */
const ipFilter = (whitelist = [], blacklist = []) => {
  return (req, res, next) => {
    try {
      const ip = getClientIP(req);
      
      // Check blacklist
      if (blacklist.length > 0 && blacklist.includes(ip)) {
        logger.warn(`Blocked IP: ${ip}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Check whitelist
      if (whitelist.length > 0 && !whitelist.includes(ip)) {
        logger.warn(`IP not in whitelist: ${ip}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    } catch (error) {
      logger.error('IP filter error:', error);
      next(error);
    }
  };
};

/**
 * Request timeout
 */
const timeout = (ms = 30000) => {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      logger.warn(`Request timeout: ${req.method} ${req.url}`);
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    }, ms);
    
    // Clear timeout on response
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });
    
    next();
  };
};

module.exports = {
  securityHeaders,
  corsMiddleware,
  xssProtection,
  sqlInjectionProtection,
  csrfProtection,
  requestValidation,
  ipFilter,
  timeout,
  corsOptions
};