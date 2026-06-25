/**
 * Server Entry Point
 * This file handles the server startup with proper error handling
 */

require('dotenv').config();
const { app } = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(error.name, error.message, error.stack);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(error.name, error.message, error.stack);
  process.exit(1);
});

// Graceful shutdown function
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, gracefully shutting down...');
  server.close(() => {
    logger.info('💥 Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}`);
  logger.info(`🌐 Health Check: http://localhost:${PORT}/health`);
  logger.info('✅ Server is ready to accept requests');
});

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export for testing
module.exports = { app, server };
