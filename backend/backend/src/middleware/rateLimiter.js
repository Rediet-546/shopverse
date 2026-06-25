const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
};

/**
 * Memory store for rate limiting (fallback when Redis is not available)
 */
class MemoryStore {
  constructor() {
    this.store = new Map();
    this.interval = setInterval(() => this.resetAll(), 60000); // Clean up every minute
  }

  async increment(key) {
    const now = Date.now();
    const record = this.store.get(key);
    
    if (record) {
      if (now < record.resetTime) {
        record.count += 1;
        return {
          totalHits: record.count,
          resetTime: new Date(record.resetTime)
        };
      } else {
        const resetTime = now + 60000;
        this.store.set(key, { count: 1, resetTime });
        return {
          totalHits: 1,
          resetTime: new Date(resetTime)
        };
      }
    } else {
      const resetTime = now + 60000;
      this.store.set(key, { count: 1, resetTime });
      return {
        totalHits: 1,
        resetTime: new Date(resetTime)
      };
    }
  }

  async decrement(key) {
    const record = this.store.get(key);
    if (record) {
      record.count -= 1;
      if (record.count <= 0) {
        this.store.delete(key);
      }
    }
  }

  async resetKey(key) {
    this.store.delete(key);
  }

  resetAll() {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create rate limiter with Redis or Memory fallback
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP. Please try again later.',
    keyGenerator = null
  } = options;

  // Try to use Redis if available, fallback to memory
  let store;
  try {
    const { redisClient } = require('../config/redis');
    if (redisClient && redisClient.isConnected) {
      // Use Redis store
      const { RedisStore } = require('rate-limit-redis');
      store = new RedisStore({
        sendCommand: (...args) => redisClient.client.sendCommand(args),
        prefix: 'ratelimit:'
      });
      logger.info('✅ Rate limiter using Redis store');
    } else {
      throw new Error('Redis not connected');
    }
  } catch (error) {
    // Fallback to memory store
    store = new MemoryStore();
    logger.warn('⚠️ Rate limiter using Memory store (fallback)');
  }

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
      if (keyGenerator) {
        return keyGenerator(req);
      }
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      return `ip:${getClientIP(req)}`;
    },
    
    store: store,
    
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${getClientIP(req)}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    
    skip: (req) => {
      if (process.env.NODE_ENV === 'test') return true;
      if (req.path === '/health') return true;
      return false;
    }
  });
};

// Common presets used throughout the API
const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests. Please try again later.'
});

const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

module.exports = Object.assign(rateLimiter, {
  rateLimiter,
  strictRateLimiter,
  loginRateLimiter,
  MemoryStore
});
