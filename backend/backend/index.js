/**
 * Index Entry Point
 * Simple entry point that requires and runs server.js
 */

require('dotenv').config();
const logger = require('./src/utils/logger');

try {
  // Import and run the server
  const { app, server } = require('./server');
  
  logger.info('✅ Application started successfully');
  
  // Export for testing
  module.exports = { app, server };
} catch (error) {
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
}