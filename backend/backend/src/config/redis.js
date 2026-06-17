const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Redis already connected');
        return this.client;
      }

      const redisUrl = process.env.NODE_ENV === 'production' 
        ? process.env.REDIS_URL_PROD 
        : process.env.REDIS_URL;

      if (!redisUrl) {
        throw new Error('Redis URL is not defined in environment variables');
      }

      const options = {
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          connectTimeout: 10000,
          keepAlive: 30000,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error('Redis max retries reached');
              return new Error('Max retries reached');
            }
            const delay = Math.min(this.retryDelay * Math.pow(2, retries), 30000);
            logger.info(`Redis reconnecting... Attempt ${retries + 1} in ${delay}ms`);
            return delay;
          }
        },
        database: 0
      };

      this.client = redis.createClient(options);

      // Event listeners
      this.client.on('connect', () => {
        logger.info('✅ Redis connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.retryCount = 0;
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.error('❌ Redis error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.warn('⚠️ Redis connection ended');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying Redis connection... Attempt ${this.retryCount} of ${this.maxRetries}`);
        await this.sleep(this.retryDelay * this.retryCount);
        return this.connect();
      }

      // Don't throw error, allow app to continue without Redis
      logger.warn('⚠️ Redis connection failed, continuing without caching');
      return null;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      const stringValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis delete pattern error:', error);
      return false;
    }
  }

  async increment(key, value = 1) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      return await this.client.incrBy(key, value);
    } catch (error) {
      logger.error('Redis increment error:', error);
      return null;
    }
  }

  async expire(key, ttl) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  async flushAll() {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis flushAll error:', error);
      return false;
    }
  }

  async acquireLock(key, ttl = 10000) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      const lockKey = `lock:${key}`;
      const token = `lock-${Date.now()}-${Math.random()}`;
      const result = await this.client.set(lockKey, token, {
        NX: true,
        PX: ttl
      });
      return result ? token : null;
    } catch (error) {
      logger.error('Redis acquireLock error:', error);
      return null;
    }
  }

  async releaseLock(key, token) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      const lockKey = `lock:${key}`;
      const currentToken = await this.client.get(lockKey);
      if (currentToken === token) {
        await this.client.del(lockKey);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Redis releaseLock error:', error);
      return false;
    }
  }

  async setCache(key, value, ttl = 3600) {
    return this.set(key, value, ttl);
  }

  async getCache(key) {
    return this.get(key);
  }

  async invalidateCache(pattern) {
    return this.deletePattern(pattern);
  }

  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('✅ Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount
    };
  }
}

const redisClient = new RedisClient();
module.exports = { 
  connectRedis: () => redisClient.connect(),
  redisClient,
  RedisClient: redisClient
};