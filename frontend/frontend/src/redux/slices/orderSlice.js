import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  vendorOrders: [],
  isLoading: false,
  error: null,
  total: 0,
  pages: 0
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.createOrder(orderData);
      toast.success('Order created successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create order';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, reason = '' }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, { status, reason });
      toast.success(`Order status updated to ${status}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel order';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchVendorOrders = createAsyncThunk(
  'orders/fetchVendorOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getVendorOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor orders');
    }
  }
);

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders || [];
        state.total = action.payload.pagination?.total || 0;
        state.pages = action.payload.pagination?.pages || 0;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Order
      .addCase(fetchOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order || action.payload;
        state.error = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Vendor Orders
      .addCase(fetchVendorOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vendorOrders = action.payload.orders || [];
        state.total = action.payload.pagination?.total || 0;
        state.pages = action.payload.pagination?.pages || 0;
        state.error = null;
      })
      .addCase(fetchVendorOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentOrder } = orderSlice.actions;

export default orderSlice.reducer;