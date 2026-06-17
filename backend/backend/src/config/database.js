const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.maxPoolSize = process.env.NODE_ENV === 'production' ? 500 : 100;
    this.minPoolSize = 10;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return this.connection;
      }

      const mongoURI = process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI_PROD 
        : process.env.MONGODB_URI;

      if (!mongoURI) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }

      const options = {
        maxPoolSize: this.maxPoolSize,
        minPoolSize: this.minPoolSize,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4, // Use IPv4
        autoIndex: process.env.NODE_ENV !== 'production',
        retryWrites: true,
        w: 'majority',
        readPreference: 'primaryPreferred',
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000
      };

      logger.info(`Connecting to MongoDB with pool size: ${this.maxPoolSize}`);

      this.connection = await mongoose.connect(mongoURI, options);
      this.isConnected = true;
      this.retryCount = 0;

      // Monitor connection events
      this.setupEventListeners();

      logger.info('✅ MongoDB connected successfully');
      logger.info(`📊 Database: ${this.connection.connection.db.databaseName}`);
      logger.info(`📍 Host: ${this.connection.connection.host}`);
      logger.info(`🔢 Port: ${this.connection.connection.port}`);

      // Start monitoring
      this.monitorHealth();

      return this.connection;

    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying connection... Attempt ${this.retryCount} of ${this.maxRetries}`);
        await this.sleep(this.retryDelay * this.retryCount);
        return this.connect();
      }

      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connection established');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB connection lost');
      this.isConnected = false;
      // Attempt to reconnect
      setTimeout(() => this.connect(), 5000);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
      this.isConnected = true;
    });

    // Handle SIGINT for clean shutdown
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
  }

  monitorHealth() {
    setInterval(async () => {
      try {
        if (this.isConnected && this.connection) {
          const status = mongoose.connection.readyState;
          const statusMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
          };
          
          logger.debug(`DB Connection Status: ${statusMap[status] || 'unknown'}`);
          
          if (status === 1 && this.connection.connection) {
            const poolSize = this.connection.connection.client?.s?.options?.maxPoolSize || 'N/A';
            const connections = this.connection.connection.client?.s?.connections?.length || 0;
            logger.debug(`Pool Size: ${poolSize}, Active Connections: ${connections}`);
          }
        }
      } catch (error) {
        logger.error('Health monitoring error:', error);
      }
    }, 30000);
  }

  async close() {
    try {
      if (this.connection) {
        logger.info('Closing database connection...');
        await this.connection.close();
        this.isConnected = false;
        logger.info('✅ Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  isConnected() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async ping() {
    try {
      if (this.isConnected) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Database ping failed:', error);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current connection pool status
  getPoolStatus() {
    if (!this.connection || !this.isConnected) {
      return { status: 'disconnected' };
    }

    const client = this.connection.connection.client;
    const poolSize = client?.s?.options?.maxPoolSize || 'N/A';
    const connections = client?.s?.connections?.length || 0;
    const available = client?.s?.connections?.filter(c => c.readyState === 1).length || 0;

    return {
      status: 'connected',
      poolSize,
      totalConnections: connections,
      availableConnections: available,
      databaseName: this.connection.connection.db?.databaseName,
      host: this.connection.connection.host,
      port: this.connection.connection.port
    };
  }
}

// Graceful shutdown function
const gracefulShutdown = async (server) => {
  try {
    logger.info('Initiating graceful shutdown...');

    // Close server connections
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing server:', err);
          } else {
            logger.info('✅ Server closed');
          }
          resolve();
        });
      });
    }

    // Close database connection
    await database.close();

    // Close Redis connection
    try {
      const { redisClient } = require('./redis');
      await redisClient.quit();
      logger.info('✅ Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis:', error);
    }

    // Close RabbitMQ connection
    try {
      const { rabbitMQ } = require('./rabbitmq');
      await rabbitMQ.close();
      logger.info('✅ RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ:', error);
    }

    logger.info('✅ Graceful shutdown completed');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    throw error;
  }
};

const database = new Database();
module.exports = { 
  connectDB: () => database.connect(), 
  gracefulShutdown,
  database 
};