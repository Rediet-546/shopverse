const Order = require('../models/Order');
const { paymentService } = require('../services/paymentService');
const { emailService } = require('../services/emailService');
const { cacheService } = require('../services/cacheService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class PaymentController {
  // ============================================
  // CREATE PAYMENT INTENT FOR ORDER
  // ============================================
  async createPaymentIntent(req, res, next) {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      const order = await Order.findById(orderId);
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
          message: 'You do not have permission to pay for this order'
        });
      }

      // Check if order is already paid
      if (order.payment.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid'
        });
      }

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(
        order.totalAmount,
        'usd',
        {
          orderId: order._id.toString(),
          userId: userId.toString(),
          orderNumber: order.orderNumber
        }
      );

      // Update order with payment intent
      order.payment.stripePaymentIntentId = paymentIntent.id;
      order.payment.status = 'pending';
      await order.save();

      logger.info(`Payment intent created for order ${order.orderNumber}`);

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });

    } catch (error) {
      logger.error('Create payment intent error:', error);
      next(error);
    }
  }

  // ============================================
  // CONFIRM PAYMENT
  // ============================================
  async confirmPayment(req, res, next) {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      // Get payment intent
      const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);
      
      // Find order by payment intent ID
      const order = await Order.findOne({
        'payment.stripePaymentIntentId': paymentIntentId
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found for this payment'
        });
      }

      // Check if user owns the order
      if (order.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to confirm this payment'
        });
      }

      // Confirm payment
      const confirmedPayment = await paymentService.confirmPayment(paymentIntentId);

      // Update order
      if (confirmedPayment.status === 'succeeded') {
        order.payment.status = 'paid';
        order.payment.transactionId = confirmedPayment.id;
        order.payment.paymentDate = new Date();
        order.status = 'confirmed';
        await order.save();

        // Send confirmation email
        try {
          const User = require('../models/User');
          const user = await User.findById(order.userId);
          await emailService.sendOrderConfirmation(user.email, order, user.firstName);
        } catch (emailError) {
          logger.error('Failed to send order confirmation:', emailError);
        }

        logger.info(`Payment confirmed for order ${order.orderNumber}`);

        res.json({
          success: true,
          message: 'Payment confirmed successfully',
          data: {
            order,
            payment: confirmedPayment
          }
        });
      } else {
        order.payment.status = 'failed';
        await order.save();

        res.status(400).json({
          success: false,
          message: 'Payment confirmation failed',
          data: confirmedPayment
        });
      }

    } catch (error) {
      logger.error('Confirm payment error:', error);
      next(error);
    }
  }

  // ============================================
  // REFUND PAYMENT
  // ============================================
  async refundPayment(req, res, next) {
    try {
      const { orderId, amount, reason } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (order.userId.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to refund this order'
        });
      }

      // Check if order is paid
      if (order.payment.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is not paid'
        });
      }

      // Check if already refunded
      if (order.payment.status === 'refunded') {
        return res.status(400).json({
          success: false,
          message: 'Order is already refunded'
        });
      }

      // Process refund
      const refundAmount = amount || order.totalAmount;
      const refund = await paymentService.refundPayment(
        order.payment.stripePaymentIntentId,
        refundAmount
      );

      // Update order
      order.payment.status = 'refunded';
      order.status = 'refunded';
      order.notes = reason || 'Refund processed';
      await order.save();

      // Restore inventory
      for (const item of order.items) {
        const Inventory = require('../models/Inventory');
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (inventory) {
          await inventory.updateStock(
            item.quantity,
            'restock',
            null,
            `Refund for order ${order.orderNumber}`
          );
        }
      }

      logger.info(`Refund processed for order ${order.orderNumber}`);

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          order,
          refund
        }
      });

    } catch (error) {
      logger.error('Refund payment error:', error);
      next(error);
    }
  }

  // ============================================
  // GET PAYMENT METHODS
  // ============================================
  async getPaymentMethods(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user's payment methods from Stripe
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user || !user.stripeCustomerId) {
        return res.json({
          success: true,
          data: []
        });
      }

      const paymentMethods = await paymentService.getCustomerPaymentMethods(
        user.stripeCustomerId
      );

      res.json({
        success: true,
        data: paymentMethods
      });

    } catch (error) {
      logger.error('Get payment methods error:', error);
      next(error);
    }
  }

  // ============================================
  // SETUP PAYMENT METHOD
  // ============================================
  async setupPaymentMethod(req, res, next) {
    try {
      const userId = req.user.id;
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Payment method ID is required'
        });
      }

      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create Stripe customer if not exists
      if (!user.stripeCustomerId) {
        const customer = await paymentService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`,
          { userId: user._id.toString() }
        );
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      // Attach payment method
      await paymentService.attachPaymentMethod(
        user.stripeCustomerId,
        paymentMethodId
      );

      logger.info(`Payment method attached for user ${user.email}`);

      res.json({
        success: true,
        message: 'Payment method added successfully'
      });

    } catch (error) {
      logger.error('Setup payment method error:', error);
      next(error);
    }
  }

  // ============================================
  // WEBHOOK HANDLER
  // ============================================
  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Stripe signature is required'
        });
      }

      const event = await paymentService.handleWebhook(
        req.body,
        signature
      );

      res.json({
        success: true,
        received: true,
        event: event.type
      });

    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }

  // ============================================
  // GET PAYMENT HISTORY
  // ============================================
  async getPaymentHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const orders = await Order.find({
        userId,
        'payment.transactionId': { $exists: true, $ne: null }
      })
        .select('orderNumber totalAmount payment status createdAt')
        .sort({ 'payment.paymentDate': -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      logger.error('Get payment history error:', error);
      next(error);
    }
  }

  // ============================================
  // GET BALANCE (Admin only)
  // ============================================
  async getBalance(req, res, next) {
    try {
      // Admin only check
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const balance = await paymentService.getBalance();

      res.json({
        success: true,
        data: balance
      });

    } catch (error) {
      logger.error('Get balance error:', error);
      next(error);
    }
  }

  // ============================================
  // GET CHARGES (Admin only)
  // ============================================
  async getCharges(req, res, next) {
    try {
      // Admin only check
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { limit = 20 } = req.query;
      const charges = await paymentService.getCharges(parseInt(limit));

      res.json({
        success: true,
        data: charges
      });

    } catch (error) {
      logger.error('Get charges error:', error);
      next(error);
    }
  }

  // ============================================
  // CREATE PAYPAL ORDER
  // ============================================
  async createPayPalOrder(req, res, next) {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      const order = await Order.findById(orderId);
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
          message: 'You do not have permission to pay for this order'
        });
      }

      // Create PayPal order
      const paypalOrder = await paymentService.createPayPalOrder(
        order.totalAmount
      );

      // Store PayPal order ID
      order.payment.transactionId = paypalOrder.id;
      order.payment.method = 'paypal';
      await order.save();

      logger.info(`PayPal order created for order ${order.orderNumber}`);

      res.json({
        success: true,
        data: paypalOrder
      });

    } catch (error) {
      logger.error('Create PayPal order error:', error);
      next(error);
    }
  }

  // ============================================
  // CAPTURE PAYPAL ORDER
  // ============================================
  async capturePayPalOrder(req, res, next) {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      const order = await Order.findById(orderId);
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
          message: 'You do not have permission to pay for this order'
        });
      }

      // Capture PayPal order
      const capture = await paymentService.capturePayPalOrder(
        order.payment.transactionId
      );

      if (capture.status === 'COMPLETED') {
        order.payment.status = 'paid';
        order.payment.paymentDate = new Date();
        order.status = 'confirmed';
        await order.save();

        // Send confirmation email
        try {
          const User = require('../models/User');
          const user = await User.findById(order.userId);
          await emailService.sendOrderConfirmation(user.email, order, user.firstName);
        } catch (emailError) {
          logger.error('Failed to send order confirmation:', emailError);
        }

        logger.info(`PayPal payment captured for order ${order.orderNumber}`);
      }

      res.json({
        success: true,
        data: capture
      });

    } catch (error) {
      logger.error('Capture PayPal order error:', error);
      next(error);
    }
  }
}

const paymentController = new PaymentController();
module.exports = paymentController;