const { rabbitMQ } = require('../config/rabbitmq');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { cacheService } = require('../services/cacheService');
const logger = require('../utils/logger');
const { QUEUES } = require('../utils/constants');

class AnalyticsWorker {
  constructor() {
    this.isRunning = false;
    this.queueName = QUEUES.ANALYTICS;
    this.aggregationInterval = null;
  }

  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Analytics worker is already running');
        return;
      }

      logger.info('Starting analytics worker...');

      // Consume analytics events
      await rabbitMQ.consume(
        this.queueName,
        async (message) => {
          await this.processAnalyticsEvent(message);
        },
        { prefetch: 10 }
      );

      // Start periodic aggregations
      this.startPeriodicAggregations();

      this.isRunning = true;
      logger.info('✅ Analytics worker started successfully');

    } catch (error) {
      logger.error('Failed to start analytics worker:', error);
      throw error;
    }
  }

  async processAnalyticsEvent(message) {
    try {
      const { type, data } = message;

      logger.info(`Processing analytics event: ${type}`);

      switch (type) {
        case 'track_view':
          await this.trackProductView(data.productId);
          break;
        case 'track_search':
          await this.trackSearch(data.query, data.resultsCount);
          break;
        case 'track_conversion':
          await this.trackConversion(data.orderId, data.userId);
          break;
        default:
          logger.warn(`Unknown analytics event type: ${type}`);
      }

      logger.info(`✅ Analytics event processed: ${type}`);

    } catch (error) {
      logger.error('Failed to process analytics event:', error);
      throw error;
    }
  }

  async trackProductView(productId) {
    try {
      // Increment view count
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } }
      );
      
      // Update trending data in cache
      const trending = await cacheService.get('analytics:trending') || {};
      trending[productId] = (trending[productId] || 0) + 1;
      
      // Keep only top 100 trending products
      const sorted = Object.entries(trending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);
      
      const cleanedTrending = Object.fromEntries(sorted);
      await cacheService.set('analytics:trending', cleanedTrending, 3600);

    } catch (error) {
      logger.error('Error tracking product view:', error);
      throw error;
    }
  }

  async trackSearch(query, resultsCount) {
    try {
      // Update search analytics
      const key = `analytics:searches:${new Date().toISOString().slice(0, 7)}`;
      const searches = await cacheService.get(key) || {};
      
      searches[query] = {
        count: (searches[query]?.count || 0) + 1,
        resultsCount: (searches[query]?.resultsCount || 0) + resultsCount
      };
      
      await cacheService.set(key, searches, 2592000); // 30 days

    } catch (error) {
      logger.error('Error tracking search:', error);
      throw error;
    }
  }

  async trackConversion(orderId, userId) {
    try {
      // Update user stats
      await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            'stats.totalOrders': 1
          }
        }
      );

      // Update daily conversion rate
      const today = new Date().toISOString().slice(0, 10);
      const key = `analytics:conversions:${today}`;
      await cacheService.increment(key);
      
      // Update product sales metrics
      const order = await Order.findById(orderId);
      if (order) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { sales: item.quantity } }
          );
        }
      }

    } catch (error) {
      logger.error('Error tracking conversion:', error);
      throw error;
    }
  }

  async startPeriodicAggregations() {
    // Run every 6 hours
    this.aggregationInterval = setInterval(async () => {
      try {
        logger.info('Running periodic analytics aggregation...');
        await this.aggregateDailyStats();
        await this.aggregateTopProducts();
        await this.cleanupOldData();
      } catch (error) {
        logger.error('Error in periodic aggregation:', error);
      }
    }, 21600000); // 6 hours
  }

  async aggregateDailyStats() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const stats = await Order.getDailyStats(yesterday);
      
      if (stats && stats.length > 0) {
        const key = `analytics:daily:${yesterday.toISOString().slice(0, 10)}`;
        await cacheService.set(key, stats[0], 86400); // 24 hours
        
        logger.info('Daily stats aggregated', stats[0]);
      }

    } catch (error) {
      logger.error('Error aggregating daily stats:', error);
      throw error;
    }
  }

  async aggregateTopProducts() {
    try {
      const period = new Date();
      period.setDate(period.getDate() - 30); // Last 30 days

      const topProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: period },
            status: { $in: ['delivered', 'shipped'] }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            name: '$product.name',
            totalQuantity: 1,
            totalRevenue: 1,
            averagePrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
          }
        }
      ]);

      await cacheService.set('analytics:top-products', topProducts, 3600);
      logger.info('Top products aggregated', { count: topProducts.length });

    } catch (error) {
      logger.error('Error aggregating top products:', error);
      throw error;
    }
  }

  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Clean up old analytics cache
      const keys = await cacheService.client.keys('analytics:*');
      for (const key of keys) {
        const ttl = await cacheService.client.ttl(key);
        if (ttl === -1) { // No expiry set
          await cacheService.client.expire(key, 2592000); // 30 days
        }
      }

      logger.info('Old analytics data cleaned up');

    } catch (error) {
      logger.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  async stop() {
    try {
      this.isRunning = false;
      if (this.aggregationInterval) {
        clearInterval(this.aggregationInterval);
        this.aggregationInterval = null;
      }
      logger.info('Analytics worker stopped');
    } catch (error) {
      logger.error('Error stopping analytics worker:', error);
    }
  }
}

const analyticsWorker = new AnalyticsWorker();

if (require.main === module) {
  analyticsWorker.start().catch(error => {
    logger.error('Analytics worker failed to start:', error);
    process.exit(1);
  });
}

module.exports = analyticsWorker;