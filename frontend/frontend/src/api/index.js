export { default as apiClient } from './client';
export { default } from './client';
export { handleApiError } from './client';

// Create API objects that use apiClient
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: ({ token, password }) => apiClient.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  getCurrentUser: () => apiClient.get('/users/profile'),

    getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },
  getTokens: () => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  }),
};

export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (data) => apiClient.post('/cart/add', data),
  updateCartItem: (data) => apiClient.put('/cart/update', data),
  removeFromCart: (productId) => apiClient.delete(`/cart/remove/${productId}`),
  clearCart: () => apiClient.delete('/cart/clear'),
  applyCoupon: (couponCode) => apiClient.post('/cart/coupon', { couponCode }),
  removeCoupon: () => apiClient.delete('/cart/coupon'),
};

export const ordersAPI = {
  getOrders: (params) => apiClient.get('/orders', { params }),
  getOrder: (id) => apiClient.get(`/orders/${id}`),
  createOrder: (data) => apiClient.post('/orders', data),
  updateOrderStatus: ({ orderId, status, reason }) => 
    apiClient.put(`/orders/${orderId}/status`, { status, reason }),
  cancelOrder: ({ orderId, reason }) => 
    apiClient.post(`/orders/${orderId}/cancel`, { reason }),
  getVendorOrders: (params) => apiClient.get('/orders/vendor', { params }),
  getVendorOrder: (id) => apiClient.get(`/orders/vendor/${id}`),
  getOrderStats: () => apiClient.get('/orders/stats'),
};

export const productsAPI = {
  getProducts: (params) => apiClient.get('/products', { params }),
  getProduct: (id) => apiClient.get(`/products/${id}`),
  getFeaturedProducts: (limit) => apiClient.get('/products/featured', { params: { limit } }),
  getPopularProducts: (limit) => apiClient.get('/products/popular', { params: { limit } }),
  getCategories: () => apiClient.get('/products/categories'),
  getProductsByVendor: (vendorId, params) => 
    apiClient.get(`/products/vendor/${vendorId}`, { params }),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  addReview: (id, data) => apiClient.post(`/products/${id}/reviews`, data),
  getProductReviews: (id, params) => apiClient.get(`/products/${id}/reviews`, { params }),
  searchProducts: (query, params) => 
    apiClient.get('/products/search', { params: { query, ...params } }),
  toggleProductStatus: ({ id, isActive }) => 
    apiClient.put(`/products/${id}`, { isActive }),
  getVendorProducts: (params) => apiClient.get('/products/vendor', { params }),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getAddresses: () => apiClient.get('/users/addresses'),
  addAddress: (data) => apiClient.post('/users/addresses', data),
  updateAddress: (addressId, data) => apiClient.put(`/users/addresses/${addressId}`, data),
  deleteAddress: (addressId) => apiClient.delete(`/users/addresses/${addressId}`),
  getUserOrders: (params) => apiClient.get('/users/orders', { params }),
  getWishlist: () => apiClient.get('/users/wishlist'),
  addToWishlist: (productId) => apiClient.post('/users/wishlist', { productId }),
  removeFromWishlist: (productId) => apiClient.delete(`/users/wishlist/${productId}`),
  updatePushToken: (pushToken) => apiClient.post('/users/push-token', { pushToken }),
  getAllUsers: (params) => apiClient.get('/users', { params }),
  getUserById: (userId) => apiClient.get(`/users/${userId}`),
  updateUserRole: (userId, role) => apiClient.put(`/users/${userId}/role`, { role }),
  toggleUserStatus: (userId, isActive) => 
    apiClient.put(`/users/${userId}/status`, { isActive }),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
};

export const paymentsAPI = {
  createPaymentIntent: (orderId) => apiClient.post('/payment/create-intent', { orderId }),
  confirmPayment: (paymentIntentId) => apiClient.post('/payment/confirm', { paymentIntentId }),
  refundPayment: ({ orderId, amount, reason }) => 
    apiClient.post('/payment/refund', { orderId, amount, reason }),
  getPaymentMethods: () => apiClient.get('/payment/methods'),
  setupPaymentMethod: (paymentMethodId) => 
    apiClient.post('/payment/setup-method', { paymentMethodId }),
  getPaymentHistory: (limit) => apiClient.get('/payment/history', { params: { limit } }),
  createPayPalOrder: (orderId) => apiClient.post('/payment/paypal/create', { orderId }),
  capturePayPalOrder: (orderId) => apiClient.post('/payment/paypal/capture', { orderId }),
  getBalance: () => apiClient.get('/payment/balance'),
  getCharges: (limit) => apiClient.get('/payment/charges', { params: { limit } }),
};