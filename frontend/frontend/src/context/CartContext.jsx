import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCart, 
  addToCart, 
  updateQuantity, 
  removeItem, 
  clearCart,
  applyCoupon,
  removeCoupon
} from '../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';

// Create context
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart Provider component
export const CartProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { 
    items, 
    subtotal, 
    discount, 
    tax, 
    shippingCost, 
    total, 
    couponCode, 
    isLoading 
  } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const addItem = async (productId, quantity = 1, variant = {}) => {
    try {
      await dispatch(addToCart({ productId, quantity, variant })).unwrap();
      toast.success('Added to cart!');
      setIsOpen(true);
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
      throw error;
    }
  };

  const updateItem = async (productId, quantity) => {
    try {
      await dispatch(updateQuantity({ productId, quantity })).unwrap();
    } catch (error) {
      toast.error(error || 'Failed to update quantity');
      throw error;
    }
  };

  const removeItemFromCart = async (productId) => {
    try {
      await dispatch(removeItem(productId)).unwrap();
      toast.success('Item removed');
    } catch (error) {
      toast.error(error || 'Failed to remove item');
      throw error;
    }
  };

  const clearCartItems = async () => {
    try {
      await dispatch(clearCart()).unwrap();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error(error || 'Failed to clear cart');
      throw error;
    }
  };

  const applyCouponToCart = async (code) => {
    try {
      await dispatch(applyCoupon(code)).unwrap();
      toast.success('Coupon applied');
    } catch (error) {
      toast.error(error || 'Invalid coupon');
      throw error;
    }
  };

  const removeCouponFromCart = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
      toast.success('Coupon removed');
    } catch (error) {
      toast.error(error || 'Failed to remove coupon');
      throw error;
    }
  };

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  const openCart = () => {
    setIsOpen(true);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return total;
  };

  const value = {
    items,
    subtotal,
    discount,
    tax,
    shippingCost,
    total,
    couponCode,
    isLoading,
    isOpen,
    addItem,
    updateItem,
    removeItem: removeItemFromCart,
    clearCart: clearCartItems,
    applyCoupon: applyCouponToCart,
    removeCoupon: removeCouponFromCart,
    toggleCart,
    closeCart,
    openCart,
    getItemCount,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;