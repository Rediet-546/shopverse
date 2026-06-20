import apiClient from './client';

const paymentsAPI = {
  /**
   * Create payment intent for order
   * @param {string} orderId - Order ID
   * @returns {Promise} - API response with client secret
   */
  createPaymentIntent: async (orderId) => {
    const response = await apiClient.post('/payment/create-intent', { orderId });
    return response.data;
  },

  /**
   * Confirm payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise} - API response
   */
  confirmPayment: async (paymentIntentId) => {
    const response = await apiClient.post('/payment/confirm', { paymentIntentId });
    return response.data;
  },

  /**
   * Refund payment
   * @param {string} orderId - Order ID
   * @param {number} amount - Amount to refund (optional)
   * @param {string} reason - Refund reason (optional)
   * @returns {Promise} - API response
   */
  refundPayment: async (orderId, amount = null, reason = null) => {
    const response = await apiClient.post('/payment/refund', {
      orderId,
      amount,
      reason
    });
    return response.data;
  },

  /**
   * Get user's payment methods
   * @returns {Promise} - API response
   */
  getPaymentMethods: async () => {
    const response = await apiClient.get('/payment/methods');
    return response.data;
  },

  /**
   * Setup payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise} - API response
   */
  setupPaymentMethod: async (paymentMethodId) => {
    const response = await apiClient.post('/payment/setup-method', { paymentMethodId });
    return response.data;
  },

  /**
   * Get payment history
   * @param {number} limit - Number of records
   * @returns {Promise} - API response
   */
  getPaymentHistory: async (limit = 10) => {
    const response = await apiClient.get('/payment/history', { params: { limit } });
    return response.data;
  },

  /**
   * Create PayPal order
   * @param {string} orderId - Order ID
   * @returns {Promise} - API response
   */
  createPayPalOrder: async (orderId) => {
    const response = await apiClient.post('/payment/paypal/create', { orderId });
    return response.data;
  },

  /**
   * Capture PayPal order
   * @param {string} orderId - Order ID
   * @returns {Promise} - API response
   */
  capturePayPalOrder: async (orderId) => {
    const response = await apiClient.post('/payment/paypal/capture', { orderId });
    return response.data;
  },

  /**
   * Get Stripe balance (Admin only)
   * @returns {Promise} - API response
   */
  getBalance: async () => {
    const response = await apiClient.get('/payment/balance');
    return response.data;
  },

  /**
   * Get Stripe charges (Admin only)
   * @param {number} limit - Number of records
   * @returns {Promise} - API response
   */
  getCharges: async (limit = 20) => {
    const response = await apiClient.get('/payment/charges', { params: { limit } });
    return response.data;
  }
};

export default paymentsAPI;