const mongoose = require('mongoose');
const logger = require('../utils/logger');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99']
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    priceSnapshot: {
      price: {
        type: Number,
        required: true,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      finalPrice: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    variant: {
      color: String,
      size: String,
      material: String
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: { expires: '7d' }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('uniqueItemCount').get(function() {
  return this.items.length;
});

cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ lastActivity: -1 });
cartSchema.index({ 'items.productId': 1 });

// Pre-save middleware
cartSchema.pre('save', async function(next) {
  try {
    // Calculate totals
    await this.calculateTotals();
    
    // Update last activity
    this.lastActivity = new Date();
    
    // Remove expired items (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.items = this.items.filter(item => item.addedAt > thirtyDaysAgo);
    
    next();
  } catch (error) {
    logger.error('Error in cart pre-save middleware:', error);
    next(error);
  }
});

// Instance methods
cartSchema.methods.calculateTotals = async function() {
  try {
    const Product = mongoose.model('Product');
    
    // Validate and update prices
    for (const item of this.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        // Remove inactive product from cart
        this.items = this.items.filter(i => 
          i.productId.toString() !== item.productId.toString()
        );
        continue;
      }
      
      // Update price snapshot
      item.priceSnapshot = {
        price: product.price,
        discount: product.discount,
        finalPrice: product.finalPrice,
        currency: 'USD'
      };
      
      // Validate stock
      if (product.stockQuantity < item.quantity) {
        item.quantity = product.stockQuantity;
        if (item.quantity === 0) {
          // Remove item if out of stock
          this.items = this.items.filter(i => 
            i.productId.toString() !== item.productId.toString()
          );
        }
      }
    }
    
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => {
      const price = item.priceSnapshot.finalPrice || item.priceSnapshot.price;
      return sum + (price * item.quantity);
    }, 0);
    
    this.subtotal = Math.round(this.subtotal * 100) / 100;
    
    // Apply coupon discount
    this.discount = this.couponDiscount || 0;
    
    // Calculate tax (e.g., 10% tax rate)
    const taxRate = 0.10;
    this.tax = Math.round((this.subtotal - this.discount) * taxRate * 100) / 100;
    
    // Calculate shipping (free shipping if subtotal > $50)
    this.shippingCost = this.subtotal > 50 ? 0 : 5.99;
    
    // Calculate total
    this.total = this.subtotal - this.discount + this.tax + this.shippingCost;
    this.total = Math.round(this.total * 100) / 100;
    
  } catch (error) {
    logger.error('Error calculating cart totals:', error);
    throw error;
  }
};

cartSchema.methods.addItem = async function(productId, quantity = 1, variant = {}) {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (!product.isActive) {
      throw new Error('Product is not available');
    }
    
    if (product.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stockQuantity}`);
    }
    
    // Check if item already exists in cart
    const existingItemIndex = this.items.findIndex(item => 
      item.productId.toString() === productId.toString() &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = this.items[existingItemIndex].quantity + quantity;
      if (product.stockQuantity < newQuantity) {
        throw new Error(`Insufficient stock. Available: ${product.stockQuantity}`);
      }
      this.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      this.items.push({
        productId,
        quantity,
        addedAt: new Date(),
        priceSnapshot: {
          price: product.price,
          discount: product.discount,
          finalPrice: product.finalPrice,
          currency: 'USD'
        },
        variant
      });
    }
    
    await this.save();
    logger.info(`Added item ${productId} to cart for user ${this.userId}`);
    return this;
    
  } catch (error) {
    logger.error('Error adding item to cart:', error);
    throw error;
  }
};

cartSchema.methods.removeItem = async function(productId, variant = {}) {
  try {
    this.items = this.items.filter(item => 
      !(item.productId.toString() === productId.toString() &&
        JSON.stringify(item.variant) === JSON.stringify(variant))
    );
    await this.save();
    logger.info(`Removed item ${productId} from cart for user ${this.userId}`);
    return this;
    
  } catch (error) {
    logger.error('Error removing item from cart:', error);
    throw error;
  }
};

cartSchema.methods.updateQuantity = async function(productId, quantity, variant = {}) {
  try {
    if (quantity < 1) {
      return this.removeItem(productId, variant);
    }
    
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stockQuantity}`);
    }
    
    const itemIndex = this.items.findIndex(item => 
      item.productId.toString() === productId.toString() &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }
    
    this.items[itemIndex].quantity = quantity;
    await this.save();
    logger.info(`Updated quantity for item ${productId} to ${quantity}`);
    return this;
    
  } catch (error) {
    logger.error('Error updating item quantity:', error);
    throw error;
  }
};

cartSchema.methods.clearCart = async function() {
  try {
    this.items = [];
    this.couponCode = null;
    this.couponDiscount = 0;
    await this.save();
    logger.info(`Cleared cart for user ${this.userId}`);
    return this;
    
  } catch (error) {
    logger.error('Error clearing cart:', error);
    throw error;
  }
};

cartSchema.methods.applyCoupon = async function(couponCode) {
  try {
    // Validate coupon (mock implementation)
    const validCoupons = {
      'SAVE10': { discount: 10, minPurchase: 50 },
      'SAVE20': { discount: 20, minPurchase: 100 },
      'FREESHIP': { discount: 0, freeShipping: true }
    };
    
    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }
    
    if (this.subtotal < (coupon.minPurchase || 0)) {
      throw new Error(`Minimum purchase of $${coupon.minPurchase} required for this coupon`);
    }
    
    this.couponCode = couponCode.toUpperCase();
    this.couponDiscount = coupon.discount || 0;
    
    // Free shipping
    if (coupon.freeShipping) {
      this.shippingCost = 0;
    }
    
    await this.save();
    logger.info(`Applied coupon ${couponCode} to cart for user ${this.userId}`);
    return this;
    
  } catch (error) {
    logger.error('Error applying coupon:', error);
    throw error;
  }
};

cartSchema.methods.removeCoupon = async function() {
  try {
    this.couponCode = null;
    this.couponDiscount = 0;
    await this.save();
    logger.info(`Removed coupon from cart for user ${this.userId}`);
    return this;
    
  } catch (error) {
    logger.error('Error removing coupon:', error);
    throw error;
  }
};

cartSchema.methods.getSummary = function() {
  return {
    items: this.items,
    subtotal: this.subtotal,
    discount: this.discount,
    tax: this.tax,
    shippingCost: this.shippingCost,
    total: this.total,
    itemCount: this.itemCount,
    uniqueItemCount: this.uniqueItemCount,
    couponCode: this.couponCode,
    couponDiscount: this.couponDiscount
  };
};

// Static methods
cartSchema.statics.getOrCreateCart = async function(userId) {
  try {
    let cart = await this.findOne({ userId });
    
    if (!cart) {
      cart = new this({ userId });
      await cart.save();
      logger.info(`Created new cart for user ${userId}`);
    }
    
    return cart;
    
  } catch (error) {
    logger.error('Error getting or creating cart:', error);
    throw error;
  }
};

cartSchema.statics.cleanupAbandoned = async function() {
  try {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.deleteMany({ 
      lastActivity: { $lt: threshold },
      items: { $size: 0 }
    });
    logger.info(`Cleaned up ${result.deletedCount} abandoned carts`);
    return result;
    
  } catch (error) {
    logger.error('Error cleaning up abandoned carts:', error);
    throw error;
  }
};

cartSchema.statics.mergeCarts = async function(sourceUserId, targetUserId) {
  try {
    const sourceCart = await this.findOne({ userId: sourceUserId });
    const targetCart = await this.findOne({ userId: targetUserId });
    
    if (!sourceCart || sourceCart.isEmpty) {
      return targetCart;
    }
    
    if (!targetCart) {
      sourceCart.userId = targetUserId;
      await sourceCart.save();
      return sourceCart;
    }
    
    // Merge items
    for (const sourceItem of sourceCart.items) {
      const existingItem = targetCart.items.find(item => 
        item.productId.toString() === sourceItem.productId.toString() &&
        JSON.stringify(item.variant) === JSON.stringify(sourceItem.variant)
      );
      
      if (existingItem) {
        existingItem.quantity += sourceItem.quantity;
      } else {
        targetCart.items.push(sourceItem);
      }
    }
    
    await targetCart.save();
    await sourceCart.remove();
    logger.info(`Merged cart from user ${sourceUserId} to ${targetUserId}`);
    return targetCart;
    
  } catch (error) {
    logger.error('Error merging carts:', error);
    throw error;
  }
};

// Expire cart items that are no longer available
cartSchema.statics.validateAllCarts = async function() {
  try {
    const carts = await this.find({});
    let validatedCount = 0;
    
    for (const cart of carts) {
      const initialLength = cart.items.length;
      await cart.save();
      if (cart.items.length !== initialLength) {
        validatedCount++;
      }
    }
    
    logger.info(`Validated ${validatedCount} carts with changes`);
    return validatedCount;
    
  } catch (error) {
    logger.error('Error validating carts:', error);
    throw error;
  }
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;