/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (error) {
    return `$${amount?.toFixed(2) || '0.00'}`;
  }
};

/**
 * Format date
 */
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
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
    return date?.toString() || 'Invalid Date';
  }
};

/**
 * Format time ago
 */
export const formatDistanceToNow = (date, options = {}) => {
  const now = new Date();
  const diff = now - new Date(date);
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

/**
 * Generate random order number
 */
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Generate SKU
 */
export const generateSKU = (productName, category) => {
  const prefix = (category || 'PRD').substring(0, 3).toUpperCase();
  const name = productName?.substring(0, 3).toUpperCase() || 'PRD';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${name}-${random}`;
};

/**
 * Calculate discount price
 */
export const calculateDiscountPrice = (price, discountPercentage) => {
  const discount = (price * discountPercentage) / 100;
  return Math.round((price - discount) * 100) / 100;
};

/**
 * Calculate tax amount
 */
export const calculateTax = (subtotal, taxRate = 0.10) => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

/**
 * Calculate shipping cost
 */
export const calculateShipping = (subtotal, freeShippingThreshold = 50) => {
  if (subtotal >= freeShippingThreshold) return 0;
  return 5.99;
};

/**
 * Paginate results
 */
export const paginate = (items, page = 1, limit = 20) => {
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
 * Sleep
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Slugify string
 */
export const slugify = (text) => {
  return text
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-') || '';
};

/**
 * Mask sensitive data
 */
export const maskData = (data, fields = ['password', 'token', 'secret', 'key']) => {
  if (typeof data !== 'object' || data === null) return data;
  
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
export const getClientIP = (req) => {
  return req?.headers?.['x-forwarded-for']?.split(',')[0] || 
         req?.connection?.remoteAddress ||
         req?.socket?.remoteAddress ||
         req?.ip ||
         '127.0.0.1';
};

/**
 * Get user agent
 */
export const getUserAgent = (req) => {
  return req?.headers?.['user-agent'] || 'Unknown';
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};