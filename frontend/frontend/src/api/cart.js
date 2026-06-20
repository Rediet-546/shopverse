import apiClient from './client';

const cartAPI = {
  /**
   * Get user's cart
   * @returns {Promise} - API response
   */
  getCart: async () => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  /**
   * Add item to cart
   * @param {Object} itemData - Item data
   * @param {string} itemData.productId - Product ID
   * @param {number} itemData.quantity - Quantity
   * @param {Object} itemData.variant - Product variant (optional)
   * @returns {Promise} - API response
   */
  addToCart: async (itemData) => {
    const response = await apiClient.post('/cart/add', itemData);
    return response.data;
  },

  /**
   * Update cart item quantity
   * @param {Object} updateData - Update data
   * @param {string} updateData.productId - Product ID
   * @param {number} updateData.quantity - New quantity
   * @param {Object} updateData.variant - Product variant (optional)
   * @returns {Promise} - API response
   */
  updateCartItem: async (updateData) => {
    const response = await apiClient.put('/cart/update', updateData);
    return response.data;
  },

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @param {Object} variant - Product variant (optional)
   * @returns {Promise} - API response
   */
  removeFromCart: async (productId, variant = {}) => {
    const response = await apiClient.delete(`/cart/remove/${productId}`, {
      data: { variant }
    });
    return response.data;
  },

  /**
   * Clear entire cart
   * @returns {Promise} - API response
   */
  clearCart: async () => {
    const response = await apiClient.delete('/cart/clear');
    return response.data;
  },

  /**
   * Apply coupon to cart
   * @param {string} couponCode - Coupon code
   * @returns {Promise} - API response
   */
  applyCoupon: async (couponCode) => {
    const response = await apiClient.post('/cart/coupon', { couponCode });
    return response.data;
  },

  /**
   * Remove coupon from cart
   * @returns {Promise} - API response
   */
  removeCoupon: async () => {
    const response = await apiClient.delete('/cart/coupon');
    return response.data;
  },

  /**
   * Get cart summary (count, total, etc.)
   * @returns {Promise} - API response
   */
  getCartSummary: async () => {
    const response = await apiClient.get('/cart/summary');
    return response.data;
  },

  /**
   * Merge guest cart with user cart (after login)
   * @param {Object} guestCart - Guest cart data
   * @returns {Promise} - API response
   */
  mergeCart: async (guestCart) => {
    const response = await apiClient.post('/cart/merge', { guestCart });
    return response.data;
  }
};

export default cartAPI;