// src/services/aiService.js
const OpenAI = require('openai');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { cacheService } = require('./cacheService');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build system prompt with shop context and user data
 */
async function buildSystemPrompt(userId) {
  // Try to get cached product context
  let productContext = await cacheService.get('ai:product_context');
  
  if (!productContext) {
    // Fetch products from database
    const products = await Product.find({ isActive: true })
      .limit(30)
      .select('name description category price finalPrice stockQuantity')
      .lean();
    
    productContext = products.map(p => 
      `- ${p.name} (${p.category}) – $${p.finalPrice}: ${p.description?.substring(0, 100) || ''}...`
    ).join('\n');
    
    // Cache for 1 hour
    await cacheService.set('ai:product_context', productContext, 3600);
  }

  // Get user order history
  let orderContext = '';
  if (userId) {
    const cacheKey = `ai:user_orders:${userId}`;
    let orders = await cacheService.get(cacheKey);
    
    if (!orders) {
      orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status totalAmount items')
        .lean();
      await cacheService.set(cacheKey, orders, 1800);
    }
    
    if (orders && orders.length > 0) {
      orderContext = 'Recent orders:\n' + orders.map(o =>
        `Order #${o.orderNumber} – status: ${o.status}, total: $${o.totalAmount.toFixed(2)}`
      ).join('\n');
    }
  }

  return `You are ShopBot, the friendly AI assistant for ShopVerse e‑commerce.

About ShopVerse:
- We sell a wide range of products across categories: Electronics, Clothing, Books, Home & Garden, Beauty & Health, Sports & Outdoors, Toys & Games, Food & Beverages, Automotive, and more.
- We offer free shipping on orders over $50.
- We have a 30‑day hassle‑free return policy.
- Payment methods: credit/debit card, PayPal, bank transfer, cash on delivery.
- Customer support is available 24/7 via email and live chat.

Our current product catalog (sample):
${productContext}

${orderContext ? `\nUser's order history:\n${orderContext}` : ''}

Instructions:
- Be helpful, concise, and friendly.
- If the user asks about a product, check the catalog and give a specific recommendation.
- If they ask about an order, use the order history if available, otherwise ask for the order number.
- If they ask about shipping or returns, provide the policy information.
- If they ask about payment, explain the available methods.
- If you don't know something, say so and offer to connect with human support.
- Never invent product information; use only the catalog provided.
- Keep responses under 200 words.
- Always respond in the same language as the user's message.
`;
}

/**
 * Main AI chat function
 */
async function getChatResponse(userMessage, userId, conversationHistory = []) {
  try {
    const systemPrompt = await buildSystemPrompt(userId);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    const reply = response.choices[0].message.content;
    logger.info(`AI response generated for user ${userId || 'guest'}`);
    return reply;
  } catch (error) {
    logger.error('OpenAI API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

/**
 * Get product recommendations based on user query
 */
async function getProductRecommendations(query) {
  try {
    // Search for products matching the query
    const products = await Product.find({
      $text: { $search: query },
      isActive: true
    })
    .limit(5)
    .select('name description finalPrice category images')
    .lean();

    if (products.length === 0) {
      // Fallback: get popular products
      const popular = await Product.find({ isActive: true })
        .sort({ sales: -1 })
        .limit(5)
        .select('name description finalPrice category images')
        .lean();
      return {
        recommendations: popular,
        message: "I couldn't find products matching your query, but here are some popular items"
      };
    }

    return {
      recommendations: products,
      message: `Found ${products.length} products matching your search`
    };
  } catch (error) {
    logger.error('Product recommendations error:', error);
    throw error;
  }
}

/**
 * Get AI-powered product insights
 */
async function getProductInsights(productId) {
  try {
    const product = await Product.findById(productId)
      .populate('vendorId', 'firstName lastName')
      .lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const prompt = `
Analyze this product and provide insights:
Name: ${product.name}
Category: ${product.category}
Price: $${product.finalPrice}
Description: ${product.description}
Sales: ${product.sales || 0}
Rating: ${product.ratings?.average || 0} (${product.ratings?.count || 0} reviews)

Provide:
1. A one-sentence summary of what makes this product special
2. Who this product is best for (target audience)
3. A suggestion for similar products customers might like
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a product analyst. Provide concise, helpful insights.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const insights = response.choices[0].message.content;
    
    return {
      product,
      insights,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Product insights error:', error);
    throw error;
  }
}

module.exports = {
  getChatResponse,
  getProductRecommendations,
  getProductInsights
};