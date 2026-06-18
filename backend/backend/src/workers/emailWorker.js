const { rabbitMQ } = require('../config/rabbitmq');
const { emailService } = require('../services/emailService');
const logger = require('../utils/logger');
const { QUEUES } = require('../utils/constants');

class EmailWorker {
  constructor() {
    this.isRunning = false;
    this.queueName = QUEUES.EMAIL;
    this.maxRetries = 3;
  }

  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Email worker is already running');
        return;
      }

      logger.info('Starting email worker...');
      
      await rabbitMQ.consume(
        this.queueName,
        async (message) => {
          await this.processEmail(message);
        },
        { prefetch: 10 }
      );

      this.isRunning = true;
      logger.info('✅ Email worker started successfully');
      
    } catch (error) {
      logger.error('Failed to start email worker:', error);
      throw error;
    }
  }

  async processEmail(message) {
    try {
      const { to, subject, template, data, retryCount = 0 } = message;

      logger.info(`Processing email to: ${to}, template: ${template}`);

      // Send email based on template
      let result;
      switch (template) {
        case 'verify-email':
          result = await emailService.sendVerificationEmail(to, data.token, data.name);
          break;
        case 'reset-password':
          result = await emailService.sendPasswordResetEmail(to, data.token, data.name);
          break;
        case 'order-confirmation':
          result = await emailService.sendOrderConfirmation(to, data.order, data.name);
          break;
        case 'order-status':
          result = await emailService.sendOrderStatusUpdate(to, data.order, data.name);
          break;
        case 'welcome':
          result = await emailService.sendWelcomeEmail(to, data.name);
          break;
        default:
          // Generic email
          result = await emailService.sendEmail({
            to,
            subject,
            html: data.html,
            text: data.text
          });
      }

      logger.info(`✅ Email sent to ${to} with ID: ${result.messageId}`);
      return result;

    } catch (error) {
      logger.error(`Failed to send email to ${message.to}:`, error);
      
      // Retry logic
      if (message.retryCount < this.maxRetries) {
        const retryCount = (message.retryCount || 0) + 1;
        logger.info(`Retrying email (${retryCount}/${this.maxRetries})...`);
        
        // Publish back to queue with retry count
        await rabbitMQ.publish(
          'shopverse.exchange',
          'email.send',
          {
            ...message,
            retryCount,
            retryAt: new Date().toISOString()
          }
        );
      } else {
        // Send to DLQ after max retries
        await rabbitMQ.publish(
          'shopverse.dlx',
          'email.failed',
          {
            ...message,
            error: error.message,
            failedAt: new Date().toISOString()
          }
        );
        logger.error(`Email failed after ${this.maxRetries} retries:`, error.message);
      }
      
      throw error;
    }
  }

  async stop() {
    try {
      this.isRunning = false;
      logger.info('Stopping email worker...');
      // Close connections if needed
    } catch (error) {
      logger.error('Error stopping email worker:', error);
    }
  }
}

const emailWorker = new EmailWorker();

// Start worker if not in test environment
if (require.main === module) {
  emailWorker.start().catch(error => {
    logger.error('Email worker failed to start:', error);
    process.exit(1);
  });
}

module.exports = emailWorker;