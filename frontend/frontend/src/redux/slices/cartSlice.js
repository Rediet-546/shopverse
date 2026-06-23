import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  items: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  shippingCost: 0,
  total: 0,
  couponCode: null,
  isLoading: false,
  error: null,
  isOpen: false
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, variant }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart({ productId, quantity, variant });
      toast.success('Added to cart!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartItem({ productId, quantity });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      toast.success('Item removed from cart');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.clearCart();
      toast.success('Cart cleared');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode, { rejectWithValue }) => {
    try {
      const response = await cartAPI.applyCoupon(couponCode);
      toast.success('Coupon applied successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid coupon code';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeCoupon();
      toast.success('Coupon removed');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove coupon';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.discount = action.payload.discount || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
        state.couponCode = action.payload.couponCode || null;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Cart
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.discount = action.payload.discount || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
        state.couponCode = action.payload.couponCode || null;
      })
      // Update Quantity
      .addCase(updateQuantity.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.discount = action.payload.discount || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
        state.couponCode = action.payload.couponCode || null;
      })
      // Remove Item
      .addCase(removeItem.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.discount = action.payload.discount || 0;
        state.tax = action.payload.tax || 0;
        state.shippingCost = action.payload.shippingCost || 0;
        state.total = action.payload.total || 0;
        state.couponCode = action.payload.couponCode || null;
      })
      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.discount = 0;
        state.tax = 0;
        state.shippingCost = 0;
        state.total = 0;
        state.couponCode = null;
      })
      // Apply Coupon
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.discount = action.payload.discount || 0;
        state.total = action.payload.total || 0;
        state.couponCode = action.payload.couponCode || null;
      })
      // Remove Coupon
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.discount = action.payload.discount || 0;
        state.total = action.payload.total || 0;
        state.couponCode = null;
      });
  }
});

export const { toggleCart, closeCart, clearError } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartCount = (state) => 
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export default cartSlice.reducer;