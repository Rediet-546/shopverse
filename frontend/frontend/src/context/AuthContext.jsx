import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, register, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsInitialized(true);
  }, []);

  // Login function
  const loginUser = async (credentials) => {
    try {
      const result = await dispatch(login(credentials)).unwrap();
      toast.success('Welcome back!');
      return result;
    } catch (error) {
      toast.error(error || 'Login failed');
      throw error;
    }
  };

  // Register function
  const registerUser = async (userData) => {
    try {
      const result = await dispatch(register(userData)).unwrap();
      toast.success('Registration successful! Please verify your email.');
      return result;
    } catch (error) {
      toast.error(error || 'Registration failed');
      throw error;
    }
  };

  // Logout function
  const logoutUser = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Clear error
  const clearAuthError = () => {
    dispatch(clearError());
  };

  // Value object
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    clearError: clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;