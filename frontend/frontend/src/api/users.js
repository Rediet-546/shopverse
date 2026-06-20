import apiClient from './client';

const usersAPI = {
  /**
   * Get current user profile
   * @returns {Promise} - API response
   */
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  /**
   * Update current user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Get user addresses
   * @returns {Promise} - API response
   */
  getAddresses: async () => {
    const response = await apiClient.get('/users/addresses');
    return response.data;
  },

  /**
   * Add new address
   * @param {Object} addressData - Address data
   * @returns {Promise} - API response
   */
  addAddress: async (addressData) => {
    const response = await apiClient.post('/users/addresses', addressData);
    return response.data;
  },

  /**
   * Update address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise} - API response
   */
  updateAddress: async (addressId, addressData) => {
    const response = await apiClient.put(`/users/addresses/${addressId}`, addressData);
    return response.data;
  },

  /**
   * Delete address
   * @param {string} addressId - Address ID
   * @returns {Promise} - API response
   */
  deleteAddress: async (addressId) => {
    const response = await apiClient.delete(`/users/addresses/${addressId}`);
    return response.data;
  },

  /**
   * Get user orders
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getUserOrders: async (params = {}) => {
    const response = await apiClient.get('/users/orders', { params });
    return response.data;
  },

  /**
   * Get user wishlist
   * @returns {Promise} - API response
   */
  getWishlist: async () => {
    const response = await apiClient.get('/users/wishlist');
    return response.data;
  },

  /**
   * Add product to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} - API response
   */
  addToWishlist: async (productId) => {
    const response = await apiClient.post('/users/wishlist', { productId });
    return response.data;
  },

  /**
   * Remove product from wishlist
   * @param {string} productId - Product ID
   * @returns {Promise} - API response
   */
  removeFromWishlist: async (productId) => {
    const response = await apiClient.delete(`/users/wishlist/${productId}`);
    return response.data;
  },

  /**
   * Update push notification token
   * @param {string} pushToken - Push notification token
   * @returns {Promise} - API response
   */
  updatePushToken: async (pushToken) => {
    const response = await apiClient.post('/users/push-token', { pushToken });
    return response.data;
  },

  // Admin only routes
  /**
   * Get all users (Admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise} - API response
   */
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user role (Admin only)
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise} - API response
   */
  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Toggle user status (Admin only)
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} - API response
   */
  toggleUserStatus: async (userId, isActive) => {
    const response = await apiClient.put(`/users/${userId}/status`, { isActive });
    return response.data;
  },

  /**
   * Delete user (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise} - API response
   */
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  }
};

export default usersAPI;