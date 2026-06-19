const logger = require('../utils/logger');
const { getClientIP, getUserAgent } = require('../utils/helpers');

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`➡️ ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    userId: req.user?.id || 'unauthenticated'
  });

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Track response body for logging (only in development)
  let responseBody = null;
  
  if (process.env.NODE_ENV === 'development') {
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    res.json = function(body) {
      responseBody = body;
      return originalJson.call(this, body);
    };
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Log level based on status code
    let logLevel = 'info';
    if (status >= 500) logLevel = 'error';
    else if (status >= 400) logLevel = 'warn';
    else if (status >= 300) logLevel = 'info';
    
    logger[logLevel](`⬅️ ${req.method} ${req.url} ${status} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      status,
      duration: `${duration}ms`,
      ip: getClientIP(req),
      userId: req.user?.id || 'unauthenticated',
      responseSize: res.get('Content-Length') || 'unknown',
      ...(process.env.NODE_ENV === 'development' && responseBody && {
        response: typeof responseBody === 'string' ? 
          responseBody.substring(0, 500) : 
          JSON.stringify(responseBody).substring(0, 500)
      })
    });
  });

  next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  logger.error(`❌ ${req.method} ${req.url} - ${err.message}`, {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    ip: getClientIP(req),
    userId: req.user?.id || 'unauthenticated',
    query: req.query,
    body: req.body,
    params: req.params
  });
  
  next(err);
};

/**
 * Performance logger middleware
 */
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        logger.warn(`⏱️ Slow request: ${req.method} ${req.url} - ${duration}ms`, {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          ip: getClientIP(req),
          userId: req.user?.id || 'unauthenticated'
        });
      }
    });
    
    next();
  };
};

/**
 * Request size logger
 */
const requestSizeLogger = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
    if (parseFloat(sizeInMB) > 5) {
      logger.warn(`📦 Large request: ${req.method} ${req.url} - ${sizeInMB}MB`, {
        method: req.method,
        url: req.url,
        size: `${sizeInMB}MB`,
        userId: req.user?.id || 'unauthenticated'
      });
    }
  }
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  performanceLogger,
  requestSizeLogger
};