const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { getClientIP } = require('../utils/helpers');

/**
 * Redis store for rate limiter
 */
class RedisStore {
  constructor(prefix = 'ratelimit:') {
    this.prefix = prefix;
    this.client = redisClient.client;
    this.isConnected = false;
    
    // Check Redis connection
    if (redisClient.isConnected) {
      this.isConnected = true;
    }
    
    // Monitor Redis connection
    redisClient.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Rate limiter Redis store connected');
    });
    
    redisClient.client.on('error', () => {
      this.isConnected = false;
      logger.warn('Rate limiter Redis store disconnected');
    });
  }

  async increment(key, windowMs) {
    try {
      if (!this.isConnected) {
        // Fallback to memory store
        return this.memoryIncrement(key, windowMs);
      }

      const now = Date.now();
      const windowKey = `${this.prefix}${key}`;
      
      // Use Lua script for atomic operation
      const luaScript = `
        local current = redis.call('get', KEYS[1])
        if current then
          current = tonumber(current)
          local ttl = redis.call('ttl', KEYS[1])
          if ttl > 0 then
            redis.call('incr', KEYS[1])
            return {current + 1, ttl}
          else
            redis.call('set', KEYS[1], 1, 'EX', ARGV[1])
            return {1, ARGV[1]}
          end
        else
          redis.call('set', KEYS[1], 1, 'EX', ARGV[1])
          return {1, ARGV[1]}
        end
      `;
      
      const result = await this.client.eval(
        luaScript,
        1,
        windowKey,
        Math.ceil(windowMs / 1000)
      );
      
      return {
        count: result[0],
        remaining: 0, // Will be calculated by rate-limiter
        resetTime: new Date(Date.now() + (result[1] * 1000))
      };
      
    } catch (error) {
      logger.error('Rate limiter Redis error:', error);
      // Fallback to memory store
      return this.memoryIncrement(key, windowMs);
    }
  }

  // Fallback memory store
  memoryIncrement(key, windowMs) {
    const memoryStore = this.memoryStore || new Map();
    this.memoryStore = memoryStore;
    
    const now = Date.now();
    const record = memoryStore.get(key);
    
    if (record) {
      if (now < record.resetTime) {
        record.count += 1;
        memoryStore.set(key, record);
        return {
          count: record.count,
          remaining: 0,
          resetTime: new Date(record.resetTime)
        };
      } else {
        const resetTime = now + windowMs;
        memoryStore.set(key, {
          count: 1,
          resetTime
        });
        return {
          count: 1,
          remaining: 0,
          resetTime: new Date(resetTime)
        };
      }
    } else {
      const resetTime = now + windowMs;
      memoryStore.set(key, {
        count: 1,
        resetTime
      });
      return {
        count: 1,
        remaining: 0,
        resetTime: new Date(resetTime)
      };
    }
  }

  async decrement(key) {
    try {
      if (!this.isConnected) {
        return;
      }
      const windowKey = `${this.prefix}${key}`;
      await this.client.decr(windowKey);
    } catch (error) {
      logger.error('Rate limiter decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      if (!this.isConnected) {
        return;
      }
      const windowKey = `${this.prefix}${key}`;
      await this.client.del(windowKey);
    } catch (error) {
      logger.error('Rate limiter reset error:', error);
    }
  }
}

/**
 * Create rate limiter
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Custom error message
 * @param {Function} options.keyGenerator - Custom key generator
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    max = parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message = 'Too many requests from this IP. Please try again later.',
    keyGenerator = null
  } = options;

  const store = new RedisStore();

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    statusCode: 429,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    
    keyGenerator: (req) => {
      if (keyGenerator) {
        return keyGenerator(req);
      }
      
      // Use user ID if authenticated, otherwise IP
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      return `ip:${getClientIP(req)}`;
    },
    
    store: {
      increment: async (key) => {
        const result = await store.increment(key, windowMs);
        return {
          totalHits: result.count,
          resetTime: result.resetTime
        };
      },
      
      decrement: async (key) => {
        await store.decrement(key);
      },
      
      resetKey: async (key) => {
        await store.resetKey(key);
      }
    },
    
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${getClientIP(req)}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    
    skip: (req) => {
      // Skip rate limiting for certain conditions
      if (process.env.NODE_ENV === 'test') return true;
      if (req.path === '/health') return true;
      if (req.path === '/metrics') return true;
      
      // Skip for admin users (higher limits)
      if (req.user && req.user.role === 'admin') {
        // Reduce limit for admin but don't skip entirely
        return false;
      }
      
      return false;
    }
  });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many attempts. Please try again later.'
});

/**
 * Login rate limiter
 */
const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.'
});

/**
 * API rate limiter (default)
 */
const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per 15 minutes
});

module.exports = {
  rateLimiter,
  strictRateLimiter,
  loginRateLimiter,
  apiRateLimiter,
  RedisStore
};