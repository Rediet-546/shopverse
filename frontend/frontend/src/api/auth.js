import apiClient from './client';

const authAPI = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Store tokens
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
    }
    
    return response.data;
  },

  /**
   * Forgot password - Request reset link
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, password) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get stored user
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authAPI;