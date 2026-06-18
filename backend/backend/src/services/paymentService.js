const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        payment_method_types: ['card'],
        capture_method: 'automatic',
        confirmation_method: 'automatic'
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;

    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      logger.info(`Payment confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  async capturePayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);
      logger.info(`Payment captured: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error capturing payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);
      logger.info(`Refund processed for: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      logger.info(`Payment intent cancelled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error cancelling payment intent:', error);
      throw error;
    }
  }

  async createRefund(chargeId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundParams = {
        charge: chargeId,
        reason
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);
      logger.info(`Refund created for charge: ${chargeId}`);
      return refund;
    } catch (error) {
      logger.error('Error creating refund:', error);
      throw error;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info(`Webhook event received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleRefundSuccess(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      return event;

    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    try {
      const { orderId } = paymentIntent.metadata;
      const Order = require('../models/Order');
      
      const order = await Order.findById(orderId);
      if (order) {
        order.payment.status = 'paid';
        order.payment.transactionId = paymentIntent.id;
        order.payment.paymentDate = new Date();
        order.status = 'confirmed';
        await order.save();
        
        logger.info(`Order ${order.orderNumber} payment successful`);
        
        // Send confirmation email
        const { emailService } = require('./emailService');
        const User = require('../models/User');
        const user = await User.findById(order.userId);
        await emailService.sendOrderConfirmation(user.email, order, user.firstName);
      }
    } catch (error) {
      logger.error('Error handling payment success:', error);
    }
  }

  async handlePaymentFailure(paymentIntent) {
    try {
      const { orderId } = paymentIntent.metadata;
      const Order = require('../models/Order');
      
      const order = await Order.findById(orderId);
      if (order) {
        order.payment.status = 'failed';
        order.notes = `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`;
        await order.save();
        
        logger.info(`Order ${order.orderNumber} payment failed`);
      }
    } catch (error) {
      logger.error('Error handling payment failure:', error);
    }
  }

  async handleRefundSuccess(refund) {
    try {
      const Order = require('../models/Order');
      const order = await Order.findOne({ 'payment.transactionId': refund.payment_intent });
      
      if (order) {
        order.payment.status = 'refunded';
        order.status = 'refunded';
        await order.save();
        
        logger.info(`Order ${order.orderNumber} refunded`);
      }
    } catch (error) {
      logger.error('Error handling refund success:', error);
    }
  }

  async handleDisputeCreated(dispute) {
    try {
      logger.warn(`Dispute created for charge: ${dispute.charge}`);
      // Notify admin or handle dispute
    } catch (error) {
      logger.error('Error handling dispute:', error);
    }
  }

  async createSetupIntent(customerId = null) {
    try {
      const params = {};
      if (customerId) {
        params.customer = customerId;
      }

      const setupIntent = await this.stripe.setupIntents.create(params);
      logger.info(`Setup intent created: ${setupIntent.id}`);
      return setupIntent;
    } catch (error) {
      logger.error('Error creating setup intent:', error);
      throw error;
    }
  }

  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      });
      
      logger.info(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  async attachPaymentMethod(customerId, paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      // Set as default
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      logger.info(`Payment method attached to customer: ${customerId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Error attaching payment method:', error);
      throw error;
    }
  }

  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return paymentMethods.data;
    } catch (error) {
      logger.error('Error getting customer payment methods:', error);
      throw error;
    }
  }

  async getCustomer(customerId) {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      logger.error('Error retrieving customer:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return balance;
    } catch (error) {
      logger.error('Error getting balance:', error);
      throw error;
    }
  }

  async getCharges(limit = 10) {
    try {
      const charges = await this.stripe.charges.list({ limit });
      return charges.data;
    } catch (error) {
      logger.error('Error getting charges:', error);
      throw error;
    }
  }

  // PayPal integration (mock for now)
  async createPayPalOrder(amount, currency = 'USD') {
    try {
      // This would be actual PayPal API call
      return {
        id: 'PAY-1234567890',
        status: 'CREATED',
        amount,
        currency
      };
    } catch (error) {
      logger.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  async capturePayPalOrder(orderId) {
    try {
      // This would be actual PayPal API call
      return {
        id: orderId,
        status: 'COMPLETED'
      };
    } catch (error) {
      logger.error('Error capturing PayPal order:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
module.exports = { paymentService, PaymentService };