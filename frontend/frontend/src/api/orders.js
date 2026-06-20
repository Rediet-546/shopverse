import apiClient from './client';

const ordersAPI = {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @param {Object} orderData.shippingAddress - Shipping address
   * @param {string} orderData.paymentMethod - Payment method
   * @param {string} orderData.notes - Order notes (optional)
   * @returns {Promise} - API response
   */
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  /**
   * Get user's orders
   * @param {Object} params - Query parameters
   * @param {string} params.status - Order status filter
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} - API response
   */
  getOrders: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  /**
   * Get single order by ID
   * @param {string} id - Order ID
   * @returns {Promise} - API response
   */
  getOrder: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Get order statistics
   * @returns {Promise} - API response
   */
  getOrderStats: async () => {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  },

  /**
   * Get vendor orders (Vendor/Admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getVendorOrders: async (params = {}) => {
    const response = await apiClient.get('/orders/vendor', { params });
    return response.data;
  },

  /**
   * Update order status (Admin/Vendor only)
   * @param {string} id - Order ID
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - New status
   * @param {string} statusData.reason - Reason for status change
   * @param {string} statusData.trackingNumber - Tracking number (for shipped)
   * @param {string} statusData.carrier - Carrier name (for shipped)
   * @returns {Promise} - API response
   */
  updateOrderStatus: async (id, statusData) => {
    const response = await apiClient.put(`/orders/${id}/status`, statusData);
    return response.data;
  },

  /**
   * Cancel an order
   * @param {string} id - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} - API response
   */
  cancelOrder: async (id, reason) => {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Track order by tracking number
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise} - API response
   */
  trackOrder: async (trackingNumber) => {
    const response = await apiClient.get(`/orders/track/${trackingNumber}`);
    return response.data;
  }
};

export default ordersAPI;