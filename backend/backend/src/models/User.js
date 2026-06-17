const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user',
    index: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-]{10,15}$/, 'Please enter a valid phone number']
  },
  address: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'USA'
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  profileImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  refreshToken: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  verificationExpire: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.virtual('isVendor').get(function() {
  return this.role === 'vendor';
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'address.city': 1 });
userSchema.index({ 'stats.totalSpent': -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
      this.password = await bcrypt.hash(this.password, salt);
      logger.debug('Password hashed for user:', this.email);
    }

    // Capitalize name fields
    if (this.isModified('firstName')) {
      this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
    }
    if (this.isModified('lastName')) {
      this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
    }

    // Ensure only one default address
    if (this.isModified('address')) {
      const defaultAddresses = this.address.filter(addr => addr.isDefault);
      if (defaultAddresses.length > 1) {
        this.address.forEach(addr => {
          if (addr !== defaultAddresses[0]) {
            addr.isDefault = false;
          }
        });
      }
      if (this.address.length > 0 && !defaultAddresses.length) {
        this.address[0].isDefault = true;
      }
    }

    next();
  } catch (error) {
    logger.error('Error in user pre-save middleware:', error);
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Password comparison error:', error);
    return false;
  }
};

userSchema.methods.generateResetToken = function() {
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    return resetToken;
  } catch (error) {
    logger.error('Error generating reset token:', error);
    throw error;
  }
};

userSchema.methods.generateVerificationToken = function() {
  try {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    this.verificationExpire = Date.now() + 86400000; // 24 hours
    return verifyToken;
  } catch (error) {
    logger.error('Error generating verification token:', error);
    throw error;
  }
};

userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.addOrder = async function(orderId, amount) {
  this.stats.totalOrders += 1;
  this.stats.totalSpent += amount;
  await this.save({ validateBeforeSave: false });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.getVendors = function() {
  return this.find({ role: 'vendor', isActive: true });
};

// Middleware to handle cascade delete
userSchema.pre('remove', async function(next) {
  try {
    // Remove all products from vendor
    if (this.role === 'vendor') {
      await mongoose.model('Product').deleteMany({ vendorId: this._id });
      logger.info(`Deleted products for vendor: ${this.email}`);
    }
    // Remove cart
    await mongoose.model('Cart').deleteOne({ userId: this._id });
    next();
  } catch (error) {
    logger.error('Error in user remove middleware:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;