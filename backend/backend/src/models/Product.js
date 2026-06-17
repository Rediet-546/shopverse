const mongoose = require('mongoose');
const logger = require('../utils/logger');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required'],
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v > 0 || this.discount === 100;
      },
      message: 'Price must be greater than 0 unless product is free'
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  finalPrice: {
    type: Number,
    required: true,
    min: [0, 'Final price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  stockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Threshold cannot be negative']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  attributes: {
    color: [String],
    size: [String],
    material: {
      type: String,
      trim: true
    },
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'mm'],
        default: 'cm'
      }
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: v => Math.round(v * 10) / 10 // Round to 1 decimal
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    images: [String],
    verified: {
      type: Boolean,
      default: false
    },
    helpful: {
      count: { type: Number, default: 0 },
      users: [mongoose.Schema.Types.ObjectId]
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  isFreeShipping: {
    type: Boolean,
    default: false
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  searchVector: {
    type: String,
    default: ''
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
productSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

productSchema.virtual('discountPercentage').get(function() {
  if (this.price === 0) return 0;
  return Math.round((this.discount / this.price) * 100);
});

productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity > 0 && this.stockQuantity <= this.stockThreshold;
});

productSchema.virtual('isOutOfStock').get(function() {
  return this.stockQuantity <= 0;
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ vendorId: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ finalPrice: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ category: 1, finalPrice: 1, 'ratings.average': -1 });
productSchema.index({ vendorId: 1, isActive: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ views: -1 });

// Pre-save middleware
productSchema.pre('save', function(next) {
  try {
    // Calculate final price with discount
    this.finalPrice = this.price * (1 - this.discount / 100);
    this.finalPrice = Math.round(this.finalPrice * 100) / 100;

    // Update search vector
    const searchComponents = [
      this.name,
      this.description,
      this.category,
      this.subCategory,
      ...(this.tags || [])
    ];
    this.searchVector = searchComponents
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Set default image if none exists
    if (this.images && this.images.length > 0 && !this.images.some(img => img.isDefault)) {
      this.images[0].isDefault = true;
    }

    // Update meta tags if not provided
    if (!this.metaTitle) {
      this.metaTitle = `${this.name} - ShopVerse`;
    }
    if (!this.metaDescription) {
      this.metaDescription = this.description.substring(0, 160);
    }

    next();
  } catch (error) {
    logger.error('Error in product pre-save middleware:', error);
    next(error);
  }
});

// Instance methods
productSchema.methods.updateRating = function(newRating) {
  try {
    const totalReviews = this.ratings.count + 1;
    const currentTotal = this.ratings.average * this.ratings.count;
    this.ratings.average = (currentTotal + newRating) / totalReviews;
    this.ratings.count = totalReviews;
    this.ratings.distribution[newRating] = (this.ratings.distribution[newRating] || 0) + 1;
  } catch (error) {
    logger.error('Error updating product rating:', error);
    throw error;
  }
};

productSchema.methods.addReview = function(userId, rating, comment, title) {
  try {
    this.reviews.push({
      userId,
      rating,
      title: title || '',
      comment: comment || '',
      date: new Date()
    });
    this.updateRating(rating);
  } catch (error) {
    logger.error('Error adding product review:', error);
    throw error;
  }
};

productSchema.methods.decreaseStock = function(quantity) {
  if (this.stockQuantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.stockQuantity}, Requested: ${quantity}`);
  }
  this.stockQuantity -= quantity;
  this.sales += quantity;
};

productSchema.methods.increaseStock = function(quantity) {
  this.stockQuantity += quantity;
};

// Static methods
productSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ sales: -1, views: -1 })
    .limit(limit);
};

productSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ category, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.search = function(query, options = {}) {
  const { category, minPrice, maxPrice, sort, limit = 20, page = 1 } = options;
  
  const searchQuery = { isActive: true };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  if (category) {
    searchQuery.category = category;
  }
  if (minPrice !== undefined) {
    searchQuery.finalPrice = { $gte: minPrice };
  }
  if (maxPrice !== undefined) {
    searchQuery.finalPrice = { ...searchQuery.finalPrice, $lte: maxPrice };
  }

  let sortOptions = { createdAt: -1 };
  if (sort === 'price-asc') sortOptions = { finalPrice: 1 };
  if (sort === 'price-desc') sortOptions = { finalPrice: -1 };
  if (sort === 'rating') sortOptions = { 'ratings.average': -1 };
  if (sort === 'popular') sortOptions = { sales: -1 };

  const skip = (page - 1) * limit;

  return this.find(searchQuery)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Middleware to handle vendor deletion
productSchema.pre('remove', async function(next) {
  try {
    // Remove product from all carts
    await mongoose.model('Cart').updateMany(
      { 'items.productId': this._id },
      { $pull: { items: { productId: this._id } } }
    );
    next();
  } catch (error) {
    logger.error('Error in product remove middleware:', error);
    next(error);
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;