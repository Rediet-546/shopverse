const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600;
    this.prefix = 'shopverse:';
  }

  async get(key) {
    try {
      if (!redisClient.isConnected) {
        return null;
      }
      const value = await redisClient.get(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!redisClient.isConnected) {
        return false;
      }
      await redisClient.set(this.prefix + key, value, ttl);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (!redisClient.isConnected) {
        return false;
      }
      await redisClient.delete(this.prefix + key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      if (!redisClient.isConnected) {
        return false;
      }
      await redisClient.deletePattern(this.prefix + pattern);
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Product caching
  async getProduct(productId) {
    return this.get(`product:${productId}`);
  }

  async setProduct(productId, product, ttl = 3600) {
    return this.set(`product:${productId}`, product, ttl);
  }

  async deleteProduct(productId) {
    await this.delete(`product:${productId}`);
    await this.deletePattern('products:list:*');
    await this.deletePattern('products:category:*');
  }

  // User caching
  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  async setUser(userId, user, ttl = 1800) {
    return this.set(`user:${userId}`, user, ttl);
  }

  async deleteUser(userId) {
    await this.delete(`user:${userId}`);
    await this.deletePattern('users:list:*');
  }

  // Session caching
  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, session, ttl = 900) {
    return this.set(`session:${sessionId}`, session, ttl);
  }

  async deleteSession(sessionId) {
    return this.delete(`session:${sessionId}`);
  }

  // Cart caching
  async getCart(userId) {
    return this.get(`cart:${userId}`);
  }

  async setCart(userId, cart, ttl = 3600) {
    return this.set(`cart:${userId}`, cart, ttl);
  }

  async deleteCart(userId) {
    return this.delete(`cart:${userId}`);
  }

  // Category caching
  async getCategoryProducts(category, page = 1) {
    return this.get(`category:${category}:page:${page}`);
  }

  async setCategoryProducts(category, page, products, ttl = 1800) {
    return this.set(`category:${category}:page:${page}`, products, ttl);
  }

  async deleteCategoryCache(category) {
    await this.deletePattern(`category:${category}:*`);
  }

  // Featured products
  async getFeaturedProducts() {
    return this.get('products:featured');
  }

  async setFeaturedProducts(products, ttl = 3600) {
    return this.set('products:featured', products, ttl);
  }

  async deleteFeaturedProducts() {
    return this.delete('products:featured');
  }

  // Rate limiting
  async incrementRateLimit(key, limit = 100, window = 900) {
    const redisKey = `ratelimit:${key}`;
    try {
      const count = await redisClient.increment(redisKey);
      if (count === 1) {
        await redisClient.expire(redisKey, window);
      }
      return {
        count,
        limit,
        remaining: Math.max(0, limit - count)
      };
    } catch (error) {
      logger.error('Rate limit error:', error);
      return { count: 0, limit, remaining: limit };
    }
  }

  // Distributed locks
  async acquireLock(resource, ttl = 10000) {
    const token = await redisClient.acquireLock(resource, ttl);
    if (token) {
      logger.debug(`Lock acquired for ${resource}`);
    }
    return token;
  }

  async releaseLock(resource, token) {
    const result = await redisClient.releaseLock(resource, token);
    if (result) {
      logger.debug(`Lock released for ${resource}`);
    }
    return result;
  }

  // Bulk operations
  async mget(keys) {
    try {
      if (!redisClient.isConnected || keys.length === 0) {
        return [];
      }
      const prefixedKeys = keys.map(k => this.prefix + k);
      const values = await redisClient.client.mGet(prefixedKeys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return [];
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (!redisClient.isConnected || keyValuePairs.length === 0) {
        return false;
      }
      
      const multi = redisClient.client.multi();
      for (const [key, value] of keyValuePairs) {
        multi.setEx(this.prefix + key, ttl, JSON.stringify(value));
      }
      await multi.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // Cache warming
  async warmCache(keys) {
    try {
      logger.info(`Warming cache for ${keys.length} keys`);
      // Implementation depends on what to warm
      return true;
    } catch (error) {
      logger.error('Cache warming error:', error);
      return false;
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern) {
    return this.deletePattern(pattern);
  }

  // Clear entire cache (use with caution)
  async clearAll() {
    try {
      if (!redisClient.isConnected) {
        return false;
      }
      await redisClient.flushAll();
      logger.warn('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Clear all cache error:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isConnected: redisClient.isConnected,
      defaultTTL: this.defaultTTL
    };
  }
}

const cacheService = new CacheService();
module.exports = { cacheService, CacheService };