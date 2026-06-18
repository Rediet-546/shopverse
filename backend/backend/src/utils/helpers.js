const logger = require('./logger');

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (error) {
    logger.error('Currency formatting error:', error);
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Format date
 */
const formatDate = (date, format = 'MM/DD/YYYY') => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    const map = {
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'DD': String(d.getDate()).padStart(2, '0'),
      'YYYY': d.getFullYear(),
      'YY': String(d.getFullYear()).slice(-2),
      'HH': String(d.getHours()).padStart(2, '0'),
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'ss': String(d.getSeconds()).padStart(2, '0')
    };
    
    return format.replace(/MM|DD|YYYY|YY|HH|mm|ss/g, matched => map[matched]);
  } catch (error) {
    logger.error('Date formatting error:', error);
    return date.toString();
  }
};

/**
 * Generate random order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Generate random SKU
 */
const generateSKU = (productName, category) => {
  const prefix = (category || 'PRD').substring(0, 3).toUpperCase();
  const name = productName.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${name}-${random}`;
};

/**
 * Calculate discount price
 */
const calculateDiscountPrice = (price, discountPercentage) => {
  const discount = (price * discountPercentage) / 100;
  return Math.round((price - discount) * 100) / 100;
};

/**
 * Calculate tax amount
 */
const calculateTax = (subtotal, taxRate = 0.10) => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

/**
 * Calculate shipping cost
 */
const calculateShipping = (subtotal, freeShippingThreshold = 50) => {
  if (subtotal >= freeShippingThreshold) {
    return 0;
  }
  return 5.99;
};

/**
 * Paginate results
 */
const paginate = (items, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = items.slice(startIndex, endIndex);
  
  return {
    data: results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: items.length,
      pages: Math.ceil(items.length / limit)
    }
  };
};

/**
 * Sleep for given milliseconds
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function with exponential backoff
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    logger.warn(`Retry failed, ${retries} attempts remaining:`, error.message);
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects deeply
 */
const deepMerge = (target, source) => {
  const merged = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      merged[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      merged[key] = source[key];
    }
  }
  
  return merged;
};

/**
 * Generate slug from string
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Mask sensitive data
 */
const maskData = (data, fields = ['password', 'token', 'secret', 'key']) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  for (const field of fields) {
    if (masked[field]) {
      masked[field] = '******';
    }
  }
  return masked;
};

/**
 * Get IP address from request
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip;
};

/**
 * Get user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

module.exports = {
  formatCurrency,
  formatDate,
  generateOrderNumber,
  generateSKU,
  calculateDiscountPrice,
  calculateTax,
  calculateShipping,
  paginate,
  sleep,
  retry,
  deepClone,
  deepMerge,
  slugify,
  maskData,
  getClientIP,
  getUserAgent
};