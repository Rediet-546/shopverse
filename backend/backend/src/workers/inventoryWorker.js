const { rabbitMQ } = require('../config/rabbitmq');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { emailService } = require('../services/emailService');
const logger = require('../utils/logger');
const { QUEUES, ROUTING_KEYS } = require('../utils/constants');

class InventoryWorker {
  constructor() {
    this.isRunning = false;
    this.queueName = QUEUES.INVENTORY;
    this.checkInterval = null;
    this.lowStockThreshold = 10;
  }

  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Inventory worker is already running');
        return;
      }

      logger.info('Starting inventory worker...');

      // Consume inventory events
      await rabbitMQ.consume(
        this.queueName,
        async (message) => {
          await this.processInventoryEvent(message);
        },
        { prefetch: 10 }
      );

      // Start periodic checks
      this.startPeriodicChecks();

      this.isRunning = true;
      logger.info('✅ Inventory worker started successfully');

    } catch (error) {
      logger.error('Failed to start inventory worker:', error);
      throw error;
    }
  }

  async processInventoryEvent(message) {
    try {
      const { type, productId, quantity, warehouseId, reference } = message;

      logger.info(`Processing inventory event: ${type} for product ${productId}`);

      const inventory = await Inventory.findOne({ productId });
      if (!inventory) {
        logger.warn(`Inventory not found for product ${productId}`);
        return;
      }

      let result;
      switch (type) {
        case 'update':
          result = await inventory.updateStock(quantity, 'restock', warehouseId, reference);
          break;
        case 'sale':
          result = await inventory.updateStock(quantity, 'sale', warehouseId, reference);
          break;
        case 'reserve':
          result = await inventory.reserveStock(quantity, warehouseId, reference);
          break;
        case 'release':
          result = await inventory.releaseStock(quantity, warehouseId, reference);
          break;
        case 'transfer':
          const [fromWarehouse, toWarehouse] = warehouseId.split('->');
          result = await inventory.transferStock(fromWarehouse, toWarehouse, quantity, reference);
          break;
        default:
          logger.warn(`Unknown inventory event type: ${type}`);
          return;
      }

      // Check for low stock
      await this.checkLowStock(inventory);

      logger.info(`✅ Inventory event processed for product ${productId}`);
      return result;

    } catch (error) {
      logger.error(`Failed to process inventory event:`, error);
      throw error;
    }
  }

  async checkLowStock(inventory) {
    try {
      const lowStockItems = inventory.checkLowStock();
      
      if (lowStockItems.length > 0) {
        logger.warn(`Low stock detected for product ${inventory.productId}`);
        
        // Publish low stock event
        await rabbitMQ.publish(
          'shopverse.exchange',
          ROUTING_KEYS.INVENTORY_LOW,
          {
            productId: inventory.productId,
            currentQuantity: inventory.availableQuantity,
            threshold: this.lowStockThreshold,
            warehouses: lowStockItems,
            timestamp: new Date().toISOString()
          }
        );

        // Send notification to vendor
        const product = await Product.findById(inventory.productId)
          .populate('vendorId', 'email firstName lastName');
        
        if (product && product.vendorId) {
          await emailService.sendEmail({
            to: product.vendorId.email,
            subject: `Low Stock Alert: ${product.name}`,
            html: `
              <h2>Low Stock Alert</h2>
              <p>Product: ${product.name}</p>
              <p>Current Stock: ${inventory.availableQuantity}</p>
              <p>Threshold: ${this.lowStockThreshold}</p>
              <p>Please restock soon to avoid stockouts.</p>
            `,
            text: `
              Low Stock Alert
              Product: ${product.name}
              Current Stock: ${inventory.availableQuantity}
              Threshold: ${this.lowStockThreshold}
              Please restock soon to avoid stockouts.
            `
          });
        }
      }
    } catch (error) {
      logger.error('Error checking low stock:', error);
    }
  }

  async startPeriodicChecks() {
    // Check every hour
    this.checkInterval = setInterval(async () => {
      try {
        logger.info('Running periodic inventory checks...');
        
        // Get all low stock items
        const lowStockItems = await Inventory.find({
          availableQuantity: { $lte: this.lowStockThreshold },
          status: { $ne: 'out_of_stock' }
        }).populate('productId', 'name category price vendorId');

        // Process each low stock item
        for (const item of lowStockItems) {
          await this.checkLowStock(item);
        }

        // Generate reorder suggestions
        const reorderNeeded = [];
        for (const item of lowStockItems) {
          const reorder = item.generateReorder();
          if (reorder.length > 0) {
            reorderNeeded.push({
              productId: item.productId._id,
              productName: item.productId.name,
              reorder: reorder
            });
          }
        }

        if (reorderNeeded.length > 0) {
          logger.info('Reorder suggestions generated', { count: reorderNeeded.length });
          
          // Publish reorder suggestions
          await rabbitMQ.publish(
            'shopverse.exchange',
            'inventory.reorder',
            {
              suggestions: reorderNeeded,
              generatedAt: new Date().toISOString()
            }
          );
        }

      } catch (error) {
        logger.error('Error in periodic inventory check:', error);
      }
    }, 3600000); // 1 hour
  }

  async stop() {
    try {
      this.isRunning = false;
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      logger.info('Inventory worker stopped');
    } catch (error) {
      logger.error('Error stopping inventory worker:', error);
    }
  }
}

const inventoryWorker = new InventoryWorker();

if (require.main === module) {
  inventoryWorker.start().catch(error => {
    logger.error('Inventory worker failed to start:', error);
    process.exit(1);
  });
}

module.exports = inventoryWorker;