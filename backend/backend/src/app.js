require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Import configurations
const { connectDB, gracefulShutdown } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/logger');
const { securityHeaders } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');

// Import utils
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const USE_REDIS = process.env.USE_REDIS !== 'false';
const USE_RABBITMQ = process.env.USE_RABBITMQ !== 'false';

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security middleware
app.use(helmet());
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'checking...',
        redis: 'checking...',
        rabbitmq: 'checking...'
      }
    };

    // Check database connection
    try {
      const { database } = require('./config/database');
      healthStatus.services.database = database.isConnected() ? 'connected' : 'disconnected';
    } catch (error) {
      healthStatus.services.database = 'disconnected';
    }

    // Check Redis only when enabled
    if (USE_REDIS) {
      try {
        const { redisClient } = require('./config/redis');
        await redisClient.ping();
        healthStatus.services.redis = 'connected';
      } catch (error) {
        healthStatus.services.redis = 'disconnected';
      }
    } else {
      healthStatus.services.redis = 'disabled';
    }

    if (!USE_RABBITMQ) {
      healthStatus.services.rabbitmq = 'disabled';
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    name: 'ShopVerse API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      payment: '/api/payment',
      users: '/api/users'
    }
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================

let server = null;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected successfully');

    // Connect to Redis when enabled
    if (USE_REDIS) {
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } else {
      logger.info('Redis disabled via USE_REDIS=false, skipping connection');
    }

    // Connect to RabbitMQ when enabled
    if (USE_RABBITMQ) {
      await connectRabbitMQ();
      logger.info('✅ RabbitMQ connected successfully');
    } else {
      logger.info('RabbitMQ disabled via USE_RABBITMQ=false, skipping connection');
    }

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Received shutdown signal, gracefully shutting down...');
      await gracefulShutdown(server);
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught Exception:', error);
      await gracefulShutdown(server);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await gracefulShutdown(server);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if not in test environment
if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
