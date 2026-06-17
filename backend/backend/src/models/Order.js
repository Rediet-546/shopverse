const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    default: () => `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    image: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'cod', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentDate: Date,
    stripePaymentIntentId: String,
    stripePaymentMethodId: String
  },
  shipping: {
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      }
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    shippedDate: Date,
    deliveredDate: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  },
  cancelledAt: Date,
  cancelledBy: String,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
orderSchema.virtual('isCompleted').get(function() {
  return ['delivered', 'cancelled', 'refunded'].includes(this.status);
});

orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

orderSchema.virtual('canReturn').get(function() {
  return this.status === 'delivered' && 
         Date.now() - this.updatedAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
});

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.transactionId': 1 });
orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 }, { sparse: true });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  try {
    // Calculate totals
    this.items.forEach(item => {
      item.total = item.price * item.quantity * (1 - (item.discount || 0) / 100);
    });

    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.totalAmount = this.subtotal - this.discount + this.tax + this.shippingCost;
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;

    // Set order number if not set
    if (!this.orderNumber) {
      this.orderNumber = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;
    }

    next();
  } catch (error) {
    logger.error('Error in order pre-save middleware:', error);
    next(error);
  }
});

// Instance methods
orderSchema.methods.updateStatus = async function(newStatus, reason = '') {
  try {
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: []
    };

    if (!validTransitions[this.status].includes(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;

    if (newStatus === 'cancelled') {
      this.cancelledAt = new Date();
      this.cancellationReason = reason;
      // Restore stock
      await this.restoreStock();
    }

    if (newStatus === 'shipped') {
      this.shipping.shippedDate = new Date();
      if (!this.shipping.estimatedDelivery) {
        this.shipping.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    if (newStatus === 'delivered') {
      this.shipping.deliveredDate = new Date();
    }

    await this.save();
    logger.info(`Order ${this.orderNumber} status updated to ${newStatus}`);
    return this;

  } catch (error) {
    logger.error(`Error updating order status: ${error.message}`);
    throw error;
  }
};

orderSchema.methods.restoreStock = async function() {
  try {
    const Product = mongoose.model('Product');
    for (const item of this.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: item.quantity } }
      );
    }
    logger.info(`Stock restored for order ${this.orderNumber}`);
  } catch (error) {
    logger.error(`Error restoring stock for order ${this.orderNumber}:`, error);
    throw error;
  }
};

orderSchema.methods.processPayment = async function(transactionId) {
  this.payment.status = 'paid';
  this.payment.transactionId = transactionId;
  this.payment.paymentDate = new Date();
  this.status = 'confirmed';
  await this.save();
};

orderSchema.methods.failPayment = async function(reason) {
  this.payment.status = 'failed';
  this.notes = reason || 'Payment failed';
  await this.save();
};

orderSchema.methods.refund = async function(transactionId) {
  this.payment.status = 'refunded';
  this.payment.transactionId = transactionId;
  this.status = 'refunded';
  await this.save();
  await this.restoreStock();
};

// Static methods
orderSchema.statics.getUserOrders = function(userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('items.productId', 'name images price');
};

orderSchema.statics.getVendorOrders = function(vendorId, status = null) {
  const Product = mongoose.model('Product');
  const query = { status: status || { $ne: 'cancelled' } };
  
  return this.aggregate([
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $match: { 'product.vendorId': vendorId, ...query } },
    {
      $group: {
        _id: '$_id',
        orderNumber: { $first: '$orderNumber' },
        userId: { $first: '$userId' },
        items: { $push: '$items' },
        subtotal: { $first: '$subtotal' },
        totalAmount: { $first: '$totalAmount' },
        status: { $first: '$status' },
        createdAt: { $first: '$createdAt' }
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
};

orderSchema.statics.getDailyStats = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['delivered', 'shipped'] }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;