import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';

// Cart Components
import Cart from './components/cart/Cart';

// Dashboard Components
import UserDashboard from './components/dashboard/UserDashboard';
import VendorDashboard from './components/dashboard/VendorDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import ProfileSettings from './components/dashboard/ProfileSettings';

// Order Components
import OrdersList from './components/orders/OrdersList';
import OrderDetails from './components/orders/OrderDetails';
import VendorOrderList from './components/orders/VendorOrderList';
import VendorOrderDetails from './components/orders/VendorOrderDetails';

// Product Components
import ProductsList from './components/products/ProductsList';
import ProductDetails from './components/products/ProductDetails';
import ProductForm from './components/products/ProductForm';

// AI - Chat Widget
import ChatWidget from './components/ai/ChatWidget';

// Styles
import './styles/global.css';

const App = () => {
  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '12px 16px',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#22c55e',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 4000,
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<ProductsList />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/products" element={<ProductsList />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfileSettings />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <OrdersList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/orders/:id" element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    } />
                    
                    {/* Vendor Routes */}
                    <Route path="/vendor/dashboard" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <VendorDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vendor/products" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <ProductsList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vendor/products/new" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <ProductForm mode="create" vendorMode={true} />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vendor/products/edit/:id" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <ProductForm mode="edit" vendorMode={true} />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vendor/orders" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <VendorOrderList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/vendor/orders/:id" element={
                      <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                        <VendorOrderDetails />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <div>User Management - Coming Soon</div>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/products" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ProductsList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/orders" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <OrdersList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <div>Analytics Dashboard - Coming Soon</div>
                      </ProtectedRoute>
                    } />
                    
                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                
                {/* ✅ ChatWidget - Placed outside main but inside the app container */}
                <ChatWidget />
              </div>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </Provider>
  );
};

export default App;