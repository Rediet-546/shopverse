const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { cacheService } = require('../services/cacheService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        minPrice,
        maxPrice,
        sort,
        search,
        vendorId
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (vendorId) {
        query.vendorId = vendorId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.finalPrice = {};
        if (minPrice !== undefined) {
          query.finalPrice.$gte = parseFloat(minPrice);
        }
        if (maxPrice !== undefined) {
          query.finalPrice.$lte = parseFloat(maxPrice);
        }
      }

      // Search
      let productsQuery;
      if (search) {
        productsQuery = Product.search(search, {
          category,
          minPrice,
          maxPrice,
          sort,
          limit: parseInt(limit),
          page: parseInt(page)
        });
      } else {
        let sortOptions = { createdAt: -1 };
        if (sort === 'price-asc') sortOptions = { finalPrice: 1 };
        if (sort === 'price-desc') sortOptions = { finalPrice: -1 };
        if (sort === 'rating') sortOptions = { 'ratings.average': -1 };
        if (sort === 'popular') sortOptions = { sales: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        productsQuery = Product.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit));
      }

      const [products, total] = await Promise.all([
        productsQuery.lean(),
        Product.countDocuments(query)
      ]);

      // Cache products for future requests
      const cacheKey = `products:${JSON.stringify(req.query)}`;
      await cacheService.set(cacheKey, { products, total }, 300); // 5 minutes

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get products error:', error);
      next(error);
    }
  }

  async getProduct(req, res, next) {
    try {
      const { id } = req.params;

      // Try cache first
      const cachedProduct = await cacheService.getProduct(id);
      if (cachedProduct) {
        return res.json({
          success: true,
          data: cachedProduct
        });
      }

      const product = await Product.findById(id)
        .populate('vendorId', 'firstName lastName email')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get inventory info
      const inventory = await Inventory.findOne({ productId: id });
      if (inventory) {
        product.inventory = {
          availableQuantity: inventory.availableQuantity,
          totalQuantity: inventory.totalQuantity,
          status: inventory.status
        };
      }

      // Cache product
      await cacheService.setProduct(id, product, 1800); // 30 minutes

      // Increment views
      await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      logger.error('Get product error:', error);
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Vendor can only create products for themselves
      const userId = req.user.id;
      const userRole = req.user.role;

      let vendorId = req.body.vendorId;
      if (userRole !== 'admin' && userRole !== 'vendor') {
        return res.status(403).json({
          success: false,
          message: 'Only vendors and admins can create products'
        });
      }

      if (userRole === 'vendor') {
        vendorId = userId;
      }

      // Check if vendor exists and is active
      const User = require('../models/User');
      const vendor = await User.findById(vendorId);
      if (!vendor || !vendor.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found or inactive'
        });
      }

      const productData = {
        ...req.body,
        vendorId
      };

      const product = new Product(productData);
      await product.save();

      // Create inventory entry
      const inventory = new Inventory({
        productId: product._id,
        warehouses: [{
          warehouseId: 'default',
          name: 'Main Warehouse',
          quantity: product.stockQuantity || 0,
          reservedQuantity: 0,
          availableQuantity: product.stockQuantity || 0,
          status: 'active',
          minStockLevel: 10,
          maxStockLevel: 1000,
          reorderPoint: 20
        }],
        totalQuantity: product.stockQuantity || 0,
        availableQuantity: product.stockQuantity || 0
      });
      await inventory.save();

      // Clear cache
      await cacheService.deletePattern('products:*');

      logger.info(`Product created: ${product._id} by vendor ${vendorId}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });

    } catch (error) {
      logger.error('Create product error:', error);
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (userRole !== 'admin' && product.vendorId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this product'
        });
      }

      // Update fields
      const allowedUpdates = [
        'name', 'description', 'category', 'subCategory',
        'price', 'discount', 'stockQuantity', 'images',
        'attributes', 'isActive', 'isFeatured', 'tags',
        'shippingCost', 'isFreeShipping', 'isDigital'
      ];

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          product[field] = req.body[field];
        }
      });

      await product.save();

      // Update inventory if stock changed
      if (req.body.stockQuantity !== undefined) {
        const inventory = await Inventory.findOne({ productId: id });
        if (inventory) {
          inventory.totalQuantity = req.body.stockQuantity;
          inventory.availableQuantity = req.body.stockQuantity - inventory.reservedQuantity;
          inventory.warehouses[0].quantity = req.body.stockQuantity;
          inventory.warehouses[0].availableQuantity = 
            req.body.stockQuantity - inventory.warehouses[0].reservedQuantity;
          await inventory.save();
        }
      }

      // Clear cache
      await cacheService.deleteProduct(id);
      await cacheService.deletePattern('products:*');

      logger.info(`Product updated: ${id}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });

    } catch (error) {
      logger.error('Update product error:', error);
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (userRole !== 'admin' && product.vendorId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this product'
        });
      }

      // Soft delete - just deactivate
      product.isActive = false;
      await product.save();

      // Delete inventory
      await Inventory.deleteOne({ productId: id });

      // Clear cache
      await cacheService.deleteProduct(id);
      await cacheService.deletePattern('products:*');

      logger.info(`Product deleted: ${id}`);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      logger.error('Delete product error:', error);
      next(error);
    }
  }

  async getProductsByVendor(req, res, next) {
    try {
      const { vendorId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const products = await Product.find({
        vendorId,
        isActive: true
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Product.countDocuments({ vendorId, isActive: true });

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get products by vendor error:', error);
      next(error);
    }
  }

  async getFeaturedProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      // Try cache
      const cached = await cacheService.getFeaturedProducts();
      if (cached) {
        return res.json({
          success: true,
          data: cached
        });
      }

      const products = await Product.getFeatured(parseInt(limit));

      // Cache
      await cacheService.setFeaturedProducts(products, 3600);

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Get featured products error:', error);
      next(error);
    }
  }

  async getPopularProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const products = await Product.getPopular(parseInt(limit));

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Get popular products error:', error);
      next(error);
    }
  }

  async addReview(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { rating, comment, title } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user already reviewed
      const existingReview = product.reviews.find(
        r => r.userId.toString() === userId
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Check if user purchased this product
      const Order = require('../models/Order');
      const hasPurchased = await Order.findOne({
        userId,
        'items.productId': id,
        status: 'delivered'
      });

      product.addReview(userId, rating, comment, title);

      // Mark as verified if purchased
      if (hasPurchased) {
        const reviewIndex = product.reviews.length - 1;
        product.reviews[reviewIndex].verified = true;
      }

      await product.save();

      // Clear cache
      await cacheService.deleteProduct(id);

      logger.info(`Review added for product ${id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: product.reviews[product.reviews.length - 1]
      });

    } catch (error) {
      logger.error('Add review error:', error);
      next(error);
    }
  }

  async getProductReviews(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const product = await Product.findById(id)
        .select('reviews')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const reviews = product.reviews
        .sort((a, b) => b.date - a.date)
        .slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: product.reviews.length,
            pages: Math.ceil(product.reviews.length / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get product reviews error:', error);
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await Product.distinct('category', { isActive: true });

      // Get count for each category
      const categoryCounts = await Promise.all(
        categories.map(async (category) => {
          const count = await Product.countDocuments({
            category,
            isActive: true
          });
          return { category, count };
        })
      );

      res.json({
        success: true,
        data: categoryCounts.sort((a, b) => b.count - a.count)
      });

    } catch (error) {
      logger.error('Get categories error:', error);
      next(error);
    }
  }
}

const productController = new ProductController();
module.exports = productController;