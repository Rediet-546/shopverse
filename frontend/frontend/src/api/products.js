import apiClient from './client';

const productsAPI = {
  /**
   * Get all products with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.category - Category filter
   * @param {number} params.minPrice - Minimum price
   * @param {number} params.maxPrice - Maximum price
   * @param {string} params.sort - Sort option
   * @param {string} params.search - Search query
   * @returns {Promise} - API response
   */
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   * @returns {Promise} - API response
   */
  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Get featured products
   * @param {number} limit - Number of products
   * @returns {Promise} - API response
   */
  getFeaturedProducts: async (limit = 10) => {
    const response = await apiClient.get('/products/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Get popular products
   * @param {number} limit - Number of products
   * @returns {Promise} - API response
   */
  getPopularProducts: async (limit = 10) => {
    const response = await apiClient.get('/products/popular', { params: { limit } });
    return response.data;
  },

  /**
   * Get product categories
   * @returns {Promise} - API response
   */
  getCategories: async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  },

  /**
   * Get products by vendor
   * @param {string} vendorId - Vendor ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getProductsByVendor: async (vendorId, params = {}) => {
    const response = await apiClient.get(`/products/vendor/${vendorId}`, { params });
    return response.data;
  },

  /**
   * Create a new product (Admin/Vendor only)
   * @param {Object} productData - Product data
   * @returns {Promise} - API response
   */
  createProduct: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  /**
   * Update a product (Admin/Vendor only)
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} - API response
   */
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  /**
   * Delete a product (Admin/Vendor only)
   * @param {string} id - Product ID
   * @returns {Promise} - API response
   */
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Add review to product
   * @param {string} id - Product ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {string} reviewData.title - Review title (optional)
   * @returns {Promise} - API response
   */
  addReview: async (id, reviewData) => {
    const response = await apiClient.post(`/products/${id}/reviews`, reviewData);
    return response.data;
  },

  /**
   * Get product reviews
   * @param {string} id - Product ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getProductReviews: async (id, params = {}) => {
    const response = await apiClient.get(`/products/${id}/reviews`, { params });
    return response.data;
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise} - API response
   */
  searchProducts: async (query, params = {}) => {
    const response = await apiClient.get('/products/search', {
      params: { query, ...params }
    });
    return response.data;
  }
};

export default productsAPI;