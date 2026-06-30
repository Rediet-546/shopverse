// src/controllers/aiController.js
const { getChatResponse } = require('../services/aiService');
const logger = require('../utils/logger');

class AIController {
  /**
   * Handle chat messages from the AI assistant
   */
  async chat(req, res, next) {
    try {
      const { message, history = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const userId = req.user?.id;
      
      // Get AI response
      const reply = await getChatResponse(message, userId, history);
      
      res.json({
        success: true,
        data: {
          reply,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('AI Chat error:', error);
      next(error);
    }
  }

  /**
   * Get product recommendations based on user query
   */
  async recommendProducts(req, res, next) {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      const recommendations = await getProductRecommendations(query);
      
      res.json({
        success: true,
        data: recommendations
      });
      
    } catch (error) {
      logger.error('Product recommendation error:', error);
      next(error);
    }
  }

  /**
   * Get AI-powered product insights
   */
  async getProductInsights(req, res, next) {
    try {
      const { productId } = req.params;
      
      const insights = await getProductInsights(productId);
      
      res.json({
        success: true,
        data: insights
      });
      
    } catch (error) {
      logger.error('Product insights error:', error);
      next(error);
    }
  }
}

module.exports = new AIController();