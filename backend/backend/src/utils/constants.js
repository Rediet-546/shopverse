// User roles
const USER_ROLES = {
  USER: 'user',
  VENDOR: 'vendor',
  ADMIN: 'admin'
};

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment methods
const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer'
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Product categories
const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'electronics',
  CLOTHING: 'clothing',
  BOOKS: 'books',
  HOME: 'home',
  BEAUTY: 'beauty',
  SPORTS: 'sports',
  TOYS: 'toys',
  FOOD: 'food',
  OTHER: 'other'
};

// Cache keys
const CACHE_KEYS = {
  USER: (id) => `user:${id}`,
  PRODUCT: (id) => `product:${id}`,
  CART: (id) => `cart:${id}`,
  SESSION: (id) => `session:${id}`,
  FEATURED: 'products:featured',
  CATEGORY: (category) => `category:${category}`,
  RATE_LIMIT: (ip) => `ratelimit:${ip}`
};

// Queue names
const QUEUES = {
  EMAIL: 'email.queue',
  INVENTORY: 'inventory.queue',
  ANALYTICS: 'analytics.queue',
  ORDER: 'order.queue',
  PAYMENT: 'payment.queue',
  NOTIFICATION: 'notification.queue'
};

// Exchange names
const EXCHANGES = {
  MAIN: 'shopverse.exchange',
  DLX: 'shopverse.dlx'
};

// Routing keys
const ROUTING_KEYS = {
  EMAIL_SEND: 'email.send',
  EMAIL_VERIFY: 'email.verify',
  EMAIL_RESET: 'email.reset',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_CHECK: 'inventory.check',
  INVENTORY_LOW: 'inventory.low',
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
  NOTIFICATION_SEND: 'notification.send'
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500
};

// Time constants (in seconds)
const TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000
};

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PRODUCT_CATEGORIES,
  CACHE_KEYS,
  QUEUES,
  EXCHANGES,
  ROUTING_KEYS,
  ERROR_CODES,
  HTTP_STATUS,
  TIME
};