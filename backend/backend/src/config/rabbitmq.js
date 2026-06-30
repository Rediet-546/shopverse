const amqp = require('amqplib');
const logger = require('../utils/logger');

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.queues = [];
    this.exchanges = [];
  }

  async connect() {
    try {
      if (process.env.USE_RABBITMQ === 'false') {
        logger.info('RabbitMQ disabled via USE_RABBITMQ=false, skipping connection');
        this.isConnected = false;
        return null;
      }

      if (this.isConnected) {
        logger.info('RabbitMQ already connected');
        return this.channel;
      }

      const rabbitmqUrl = process.env.NODE_ENV === 'production'
        ? process.env.RABBITMQ_URL_PROD
        : process.env.RABBITMQ_URL;

      if (!rabbitmqUrl) {
        throw new Error('RabbitMQ URL is not defined');
      }

      logger.info('Connecting to RabbitMQ...');

      this.connection = await amqp.connect(rabbitmqUrl);
      
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        // Attempt to reconnect
        setTimeout(() => this.connect(), 5000);
      });

      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.retryCount = 0;

      // Setup exchanges and queues
      await this.setupExchangesAndQueues();

      logger.info('✅ RabbitMQ connected successfully');
      return this.channel;

    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying RabbitMQ connection... Attempt ${this.retryCount} of ${this.maxRetries}`);
        await this.sleep(this.retryDelay * this.retryCount);
        return this.connect();
      }

      logger.warn('⚠️ RabbitMQ connection failed, continuing without message queue');
      return null;
    }
  }

  async setupExchangesAndQueues() {
    if (!this.channel) return;

    // Exchanges
    const exchanges = [
      { name: 'shopverse.exchange', type: 'topic', options: { durable: true } },
      { name: 'shopverse.dlx', type: 'topic', options: { durable: true } }
    ];

    for (const exchange of exchanges) {
      await this.channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options
      );
      logger.info(`Exchange created: ${exchange.name}`);
    }

    // Queues with dead letter support
    const queues = [
      { 
        name: 'email.queue', 
        options: { 
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'shopverse.dlx',
            'x-dead-letter-routing-key': 'email.failed'
          }
        },
        routingKeys: ['email.send', 'email.verify', 'email.reset']
      },
      { 
        name: 'inventory.queue', 
        options: { durable: true },
        routingKeys: ['inventory.update', 'inventory.check', 'inventory.low']
      },
      { 
        name: 'analytics.queue', 
        options: { durable: true },
        routingKeys: ['analytics.track', 'analytics.aggregate']
      },
      { 
        name: 'order.queue', 
        options: { durable: true },
        routingKeys: ['order.created', 'order.updated', 'order.shipped']
      },
      { 
        name: 'payment.queue', 
        options: { durable: true },
        routingKeys: ['payment.processed', 'payment.failed', 'payment.refund']
      }
    ];

    // Dead letter queue
    await this.channel.assertQueue('dlq', { durable: true });
    await this.channel.bindQueue('dlq', 'shopverse.dlx', '#');

    for (const queue of queues) {
      await this.channel.assertQueue(queue.name, queue.options);
      
      // Bind queue to exchange with routing keys
      for (const routingKey of queue.routingKeys) {
        await this.channel.bindQueue(queue.name, 'shopverse.exchange', routingKey);
      }
      
      logger.info(`Queue created: ${queue.name}`);
    }

    this.queues = queues;
  }

  async publish(exchange, routingKey, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn('RabbitMQ not connected, message not published');
        return false;
      }

      const content = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      };

      const result = this.channel.publish(
        exchange || 'shopverse.exchange',
        routingKey,
        content,
        { ...defaultOptions, ...options }
      );

      logger.debug(`Message published to ${routingKey}:`, message);
      return result;

    } catch (error) {
      logger.error('Failed to publish message:', error);
      return false;
    }
  }

  async consume(queue, callback, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn('RabbitMQ not connected, cannot consume');
        return null;
      }

      const defaultOptions = {
        noAck: false,
        prefetch: 10
      };

      const consumerOptions = { ...defaultOptions, ...options };

      await this.channel.prefetch(consumerOptions.prefetch);

      const consumer = await this.channel.consume(
        queue,
        async (message) => {
          if (!message) return;

          try {
            const content = JSON.parse(message.content.toString());
            
            // Process message
            await callback(content, message);

            // Acknowledge message
            this.channel.ack(message);
            
            logger.debug(`Message processed from ${queue}:`, content);

          } catch (error) {
            logger.error(`Error processing message from ${queue}:`, error);
            
            // Reject and requeue or send to DLQ
            const shouldRequeue = error.requeue !== false;
            this.channel.nack(message, false, shouldRequeue);
          }
        },
        { noAck: consumerOptions.noAck }
      );

      logger.info(`Consumer started for queue: ${queue}`);
      return consumer;

    } catch (error) {
      logger.error(`Failed to start consumer for ${queue}:`, error);
      return null;
    }
  }

  async sendToQueue(queue, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn('RabbitMQ not connected, message not sent to queue');
        return false;
      }

      const content = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      };

      const result = this.channel.sendToQueue(
        queue,
        content,
        { ...defaultOptions, ...options }
      );

      logger.debug(`Message sent to queue ${queue}:`, message);
      return result;

    } catch (error) {
      logger.error(`Failed to send message to ${queue}:`, error);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.info('RabbitMQ channel closed');
      }
      if (this.connection) {
        await this.connection.close();
        this.isConnected = false;
        logger.info('RabbitMQ connection closed');
      }
    } catch (error) {
      logger.error('Error closing RabbitMQ:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount,
      queueCount: this.queues.length
    };
  }
}

const rabbitMQ = new RabbitMQ();
module.exports = { 
  connectRabbitMQ: () => rabbitMQ.connect(),
  rabbitMQ,
  RabbitMQ: rabbitMQ
};
