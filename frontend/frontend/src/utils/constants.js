// User roles
export const USER_ROLES = {
  USER: 'user',
  VENDOR: 'vendor',
  ADMIN: 'admin'
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer'
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// HTTP status codes
export const HTTP_STATUS = {
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
export const TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000
};

// Cache keys
export const CACHE_KEYS = {
  USER: (id) => `user:${id}`,
  PRODUCT: (id) => `product:${id}`,
  CART: (id) => `cart:${id}`,
  SESSION: (id) => `session:${id}`,
  FEATURED: 'products:featured',
  CATEGORY: (category) => `category:${category}`,
  RATE_LIMIT: (ip) => `ratelimit:${ip}`
};