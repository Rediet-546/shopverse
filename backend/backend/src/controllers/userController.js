const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { cacheService } = require('../services/cacheService');
const { emailService } = require('../services/emailService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { generateTokens } = require('../utils/jwt');

class UserController {
  // ============================================
  // GET CURRENT USER PROFILE
  // ============================================
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      // Try cache first
      const cachedUser = await cacheService.getUser(userId);
      if (cachedUser) {
        return res.json({
          success: true,
          data: cachedUser
        });
      }

      const user = await User.findById(userId)
        .select('-password -refreshToken -resetPasswordToken -verificationToken')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user stats
      const orderCount = await Order.countDocuments({ userId });
      const totalSpent = await Order.aggregate([
        { $match: { userId, status: { $in: ['delivered', 'shipped'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      user.stats = {
        orderCount,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
      };

      // Cache user
      await cacheService.setUser(userId, user, 1800);

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  // ============================================
  // UPDATE CURRENT USER PROFILE
  // ============================================
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, preferences } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;
      if (preferences) {
        user.preferences = {
          ...user.preferences,
          ...preferences
        };
      }

      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  // ============================================
  // GET USER ADDRESSES
  // ============================================
  async getAddresses(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).select('address');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.address || []
      });

    } catch (error) {
      logger.error('Get addresses error:', error);
      next(error);
    }
  }

  // ============================================
  // ADD ADDRESS
  // ============================================
  async addAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const { street, city, state, country, zipCode, type, isDefault } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If this is default, unset other defaults
      if (isDefault) {
        user.address.forEach(addr => {
          if (addr.isDefault) addr.isDefault = false;
        });
      }

      user.address.push({
        street,
        city,
        state,
        country,
        zipCode,
        type: type || 'home',
        isDefault: isDefault || false
      });

      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`Address added for user: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: user.address
      });

    } catch (error) {
      logger.error('Add address error:', error);
      next(error);
    }
  }

  // ============================================
  // UPDATE ADDRESS
  // ============================================
  async updateAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const { addressId } = req.params;
      const { street, city, state, country, zipCode, type, isDefault } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const addressIndex = user.address.findIndex(
        addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // If this is default, unset other defaults
      if (isDefault) {
        user.address.forEach((addr, index) => {
          if (index !== addressIndex && addr.isDefault) {
            addr.isDefault = false;
          }
        });
      }

      // Update address
      const address = user.address[addressIndex];
      if (street) address.street = street;
      if (city) address.city = city;
      if (state) address.state = state;
      if (country) address.country = country;
      if (zipCode) address.zipCode = zipCode;
      if (type) address.type = type;
      if (isDefault !== undefined) address.isDefault = isDefault;

      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`Address updated for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: user.address
      });

    } catch (error) {
      logger.error('Update address error:', error);
      next(error);
    }
  }

  // ============================================
  // DELETE ADDRESS
  // ============================================
  async deleteAddress(req, res, next) {
    try {
      const userId = req.user.id;
      const { addressId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const addressIndex = user.address.findIndex(
        addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // If deleting default address, set another as default
      if (user.address[addressIndex].isDefault && user.address.length > 1) {
        user.address.splice(addressIndex, 1);
        user.address[0].isDefault = true;
      } else {
        user.address.splice(addressIndex, 1);
      }

      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`Address deleted for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Address deleted successfully',
        data: user.address
      });

    } catch (error) {
      logger.error('Delete address error:', error);
      next(error);
    }
  }

  // ============================================
  // GET USER ORDERS (for profile)
  // ============================================
  async getUserOrders(req, res, next) {
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
      logger.error('Get user orders error:', error);
      next(error);
    }
  }

  // ============================================
  // GET USER WISHLIST (if implemented)
  // ============================================
  async getWishlist(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).populate('wishlist');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.wishlist || []
      });

    } catch (error) {
      logger.error('Get wishlist error:', error);
      next(error);
    }
  }

  // ============================================
  // ADD TO WISHLIST
  // ============================================
  async addToWishlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.body;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or inactive'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if already in wishlist
      if (user.wishlist && user.wishlist.includes(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Product already in wishlist'
        });
      }

      // Initialize wishlist if not exists
      if (!user.wishlist) {
        user.wishlist = [];
      }

      user.wishlist.push(productId);
      await user.save();

      logger.info(`Product ${productId} added to wishlist for user ${user.email}`);

      res.json({
        success: true,
        message: 'Product added to wishlist',
        data: user.wishlist
      });

    } catch (error) {
      logger.error('Add to wishlist error:', error);
      next(error);
    }
  }

  // ============================================
  // REMOVE FROM WISHLIST
  // ============================================
  async removeFromWishlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist is empty'
        });
      }

      const index = user.wishlist.indexOf(productId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in wishlist'
        });
      }

      user.wishlist.splice(index, 1);
      await user.save();

      logger.info(`Product ${productId} removed from wishlist for user ${user.email}`);

      res.json({
        success: true,
        message: 'Product removed from wishlist',
        data: user.wishlist
      });

    } catch (error) {
      logger.error('Remove from wishlist error:', error);
      next(error);
    }
  }

  // ============================================
  // ADMIN: GET ALL USERS
  // ============================================
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, isActive } = req.query;

      const query = {};
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken -resetPasswordToken -verificationToken')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  }

  // ============================================
  // ADMIN: GET USER BY ID
  // ============================================
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password -refreshToken -resetPasswordToken -verificationToken')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user stats
      const orderCount = await Order.countDocuments({ userId });
      const totalSpent = await Order.aggregate([
        { $match: { userId, status: { $in: ['delivered', 'shipped'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      user.stats = {
        orderCount,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
      };

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('Get user by ID error:', error);
      next(error);
    }
  }

  // ============================================
  // ADMIN: UPDATE USER ROLE
  // ============================================
  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.role = role;
      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`User ${user.email} role updated to ${role}`);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });

    } catch (error) {
      logger.error('Update user role error:', error);
      next(error);
    }
  }

  // ============================================
  // ADMIN: ACTIVATE/DEACTIVATE USER
  // ============================================
  async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive is required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deactivating yourself
      if (userId === req.user.id && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account'
        });
      }

      user.isActive = isActive;
      await user.save();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`User ${user.email} status updated to ${isActive ? 'active' : 'inactive'}`);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user
      });

    } catch (error) {
      logger.error('Toggle user status error:', error);
      next(error);
    }
  }

  // ============================================
  // ADMIN: DELETE USER
  // ============================================
  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      // Prevent deleting yourself
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete related data
      await Cart.deleteOne({ userId });
      await Order.deleteMany({ userId });
      // If vendor, delete products
      if (user.role === 'vendor') {
        await Product.deleteMany({ vendorId: userId });
      }

      await user.remove();

      // Invalidate cache
      await cacheService.deleteUser(userId);

      logger.info(`User ${user.email} deleted`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  }

  // ============================================
  // UPDATE PUSH NOTIFICATION TOKEN
  // ============================================
  async updatePushToken(req, res, next) {
    try {
      const userId = req.user.id;
      const { pushToken } = req.body;

      if (!pushToken) {
        return res.status(400).json({
          success: false,
          message: 'Push token is required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.pushToken = pushToken;
      await user.save();

      logger.info(`Push token updated for user ${user.email}`);

      res.json({
        success: true,
        message: 'Push token updated successfully'
      });

    } catch (error) {
      logger.error('Update push token error:', error);
      next(error);
    }
  }
}

const userController = new UserController();
module.exports = userController;