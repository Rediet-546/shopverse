const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { cacheService } = require('../services/cacheService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class CartController {
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;

      // Try cache
      const cachedCart = await cacheService.getCart(userId);
      if (cachedCart) {
        return res.json({
          success: true,
          data: cachedCart
        });
      }

      const cart = await Cart.getOrCreateCart(userId);
      
      // Cache cart
      await cacheService.setCart(userId, cart.getSummary());

      res.json({
        success: true,
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Get cart error:', error);
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { productId, quantity = 1, variant = {} } = req.body;

      // Check product availability
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is not available'
        });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.stockQuantity}`
        });
      }

      const cart = await Cart.getOrCreateCart(userId);
      await cart.addItem(productId, quantity, variant);

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Added ${quantity} of ${productId} to cart for user ${userId}`);

      res.json({
        success: true,
        message: 'Item added to cart',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Add to cart error:', error);
      next(error);
    }
  }

  async updateCartItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity, variant = {} } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      const cart = await Cart.getOrCreateCart(userId);
      await cart.updateQuantity(productId, quantity, variant);

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Updated cart item ${productId} for user ${userId}`);

      res.json({
        success: true,
        message: 'Cart updated successfully',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Update cart error:', error);
      next(error);
    }
  }

  async removeFromCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, variant = {} } = req.params;

      const cart = await Cart.getOrCreateCart(userId);
      await cart.removeItem(productId, variant);

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Removed ${productId} from cart for user ${userId}`);

      res.json({
        success: true,
        message: 'Item removed from cart',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Remove from cart error:', error);
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;

      const cart = await Cart.getOrCreateCart(userId);
      await cart.clearCart();

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Cart cleared for user ${userId}`);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Clear cart error:', error);
      next(error);
    }
  }

  async applyCoupon(req, res, next) {
    try {
      const userId = req.user.id;
      const { couponCode } = req.body;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      const cart = await Cart.getOrCreateCart(userId);
      await cart.applyCoupon(couponCode);

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Coupon ${couponCode} applied to cart for user ${userId}`);

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Apply coupon error:', error);
      next(error);
    }
  }

  async removeCoupon(req, res, next) {
    try {
      const userId = req.user.id;

      const cart = await Cart.getOrCreateCart(userId);
      await cart.removeCoupon();

      // Invalidate cache
      await cacheService.deleteCart(userId);

      logger.info(`Coupon removed from cart for user ${userId}`);

      res.json({
        success: true,
        message: 'Coupon removed successfully',
        data: cart.getSummary()
      });

    } catch (error) {
      logger.error('Remove coupon error:', error);
      next(error);
    }
  }
}

const cartController = new CartController();
module.exports = cartController;