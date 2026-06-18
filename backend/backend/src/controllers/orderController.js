const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { paymentService } = require('../services/paymentService');
const { emailService } = require('../services/emailService');
const { cacheService } = require('../services/cacheService');
const { rabbitMQ } = require('../config/rabbitmq');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { shippingAddress, paymentMethod, notes } = req.body;

      // Get user's cart
      const cart = await Cart.findOne({ userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate stock and get product details
      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId);
        if (!product || !product.isActive) {
          return res.status(400).json({
            success: false,
            message: `Product ${cartItem.productId} is not available`
          });
        }

        if (product.stockQuantity < cartItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
          });
        }

        const finalPrice = product.finalPrice || product.price;
        const total = finalPrice * cartItem.quantity;
        subtotal += total;

        orderItems.push({
          productId: product._id,
          name: product.name,
          quantity: cartItem.quantity,
          price: product.price,
          discount: product.discount,
          total,
          image: product.images && product.images.length > 0 ? product.images[0].url : null
        });
      }

      // Calculate totals
      const taxRate = 0.10; // 10% tax
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const shippingCost = subtotal > 50 ? 0 : 5.99;
      const totalAmount = subtotal + tax + shippingCost;

      // Create order
      const order = new Order({
        userId,
        items: orderItems,
        subtotal,
        tax,
        shippingCost,
        totalAmount,
        status: 'pending',
        payment: {
          method: paymentMethod || 'card',
          status: 'pending'
        },
        shipping: {
          address: shippingAddress
        },
        notes,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      await order.save();

      // Create payment intent
      let paymentIntent = null;
      if (paymentMethod === 'card') {
        try {
          paymentIntent = await paymentService.createPaymentIntent(
            totalAmount,
            'usd',
            {
              orderId: order._id.toString(),
              userId: userId.toString(),
              orderNumber: order.orderNumber
            }
          );
          order.payment.stripePaymentIntentId = paymentIntent.id;
          await order.save();
        } catch (paymentError) {
          logger.error('Payment intent creation failed:', paymentError);
          // Continue with order creation, payment will be retried
        }
      }

      // Reserve inventory
      for (const item of orderItems) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (inventory) {
          await inventory.reserveStock(
            item.quantity,
            null,
            `Order ${order.orderNumber}`
          );
        }
      }

      // Clear cart
      await cart.clearCart();

      // Send order confirmation email
      try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        await emailService.sendOrderConfirmation(user.email, order, user.firstName);
      } catch (emailError) {
        logger.error('Failed to send order confirmation:', emailError);
      }

      // Publish order created event
      try {
        await rabbitMQ.publish(
          'shopverse.exchange',
          'order.created',
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        );
      } catch (rabbitError) {
        logger.error('Failed to publish order event:', rabbitError);
      }

      logger.info(`Order created: ${order.orderNumber}`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order,
          paymentIntent: paymentIntent ? {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
          } : null
        }
      });

    } catch (error) {
      logger.error('Create order error:', error);
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const query = { userId };
      if (status) {
        query.status = status;
      }

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .populate('items.productId', 'name images')
          .lean(),
        Order.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get orders error:', error);
      next(error);
    }
  }

  async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await Order.findById(id)
        .populate('items.productId', 'name images description')
        .populate('userId', 'firstName lastName email')
        .lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (order.userId._id.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this order'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      logger.error('Get order error:', error);
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (userRole !== 'admin') {
        // Vendors can only update their own orders
        if (userRole === 'vendor') {
          const productIds = order.items.map(item => item.productId);
          const products = await Product.find({ _id: { $in: productIds }, vendorId: userId });
          if (products.length === 0) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to update this order'
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to update this order'
          });
        }
      }

      await order.updateStatus(status, reason);

      // If shipped, add tracking info
      if (status === 'shipped' && req.body.trackingNumber) {
        order.shipping.trackingNumber = req.body.trackingNumber;
        order.shipping.carrier = req.body.carrier || 'Unknown';
        await order.save();
      }

      // Send status update email
      try {
        const User = require('../models/User');
        const user = await User.findById(order.userId);
        await emailService.sendOrderStatusUpdate(user.email, order, user.firstName);
      } catch (emailError) {
        logger.error('Failed to send order status email:', emailError);
      }

      // Publish order updated event
      try {
        await rabbitMQ.publish(
          'shopverse.exchange',
          'order.updated',
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            userId: order.userId
          }
        );
      } catch (rabbitError) {
        logger.error('Failed to publish order update event:', rabbitError);
      }

      logger.info(`Order ${order.orderNumber} status updated to ${status}`);

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order
      });

    } catch (error) {
      logger.error('Update order status error:', error);
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user owns the order
      if (order.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this order'
        });
      }

      // Check if order can be cancelled
      if (!order.canCancel) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage'
        });
      }

      await order.updateStatus('cancelled', reason || 'User requested cancellation');

      // Cancel payment if any
      if (order.payment.stripePaymentIntentId) {
        try {
          await paymentService.cancelPaymentIntent(order.payment.stripePaymentIntentId);
        } catch (paymentError) {
          logger.error('Failed to cancel payment:', paymentError);
          // If payment was already captured, initiate refund
          if (order.payment.status === 'paid') {
            try {
              await paymentService.refundPayment(order.payment.stripePaymentIntentId);
            } catch (refundError) {
              logger.error('Failed to refund payment:', refundError);
            }
          }
        }
      }

      // Restore inventory
      for (const item of order.items) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (inventory) {
          try {
            await inventory.releaseStock(item.quantity, null, `Order ${order.orderNumber} cancelled`);
          } catch (inventoryError) {
            logger.error('Failed to restore inventory:', inventoryError);
          }
        }
      }

      logger.info(`Order ${order.orderNumber} cancelled by user ${userId}`);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });

    } catch (error) {
      logger.error('Cancel order error:', error);
      next(error);
    }
  }

  async getVendorOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await Order.getVendorOrders(userId, status);

      const total = result.length;
      const orders = result
        .slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get vendor orders error:', error);
      next(error);
    }
  }

  async getOrderStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let query = {};
      if (userRole === 'vendor') {
        // Get all products for this vendor
        const products = await Product.find({ vendorId: userId });
        const productIds = products.map(p => p._id);
        query = { 'items.productId': { $in: productIds } };
      } else if (userRole === 'user') {
        query = { userId };
      }

      // Get stats
      const stats = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            totalItems: { $sum: { $size: '$items' } }
          }
        }
      ]);

      // Status breakdown
      const statusBreakdown = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          stats: stats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalItems: 0
          },
          statusBreakdown: statusBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      logger.error('Get order stats error:', error);
      next(error);
    }
  }
}

const orderController = new OrderController();
module.exports = orderController;