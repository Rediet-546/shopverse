// src/redux/slices/wishlistSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

const initialState = {
  items: [],
  wishlist: [],
  isLoading: false,
  error: null
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users/wishlist');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/wishlist', { productId });
      toast.success('Wishlist updated');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update wishlist';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data || action.payload.items || action.payload.wishlist || [];
        state.wishlist = state.items;
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        const productId = action.meta.arg;
        const index = state.items.findIndex(item => item._id === productId);
        if (index > -1) {
          state.items.splice(index, 1);
        } else {
          state.items.push(action.payload.data || { _id: productId });
        }
        state.wishlist = state.items;
        state.error = null;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export default wishlistSlice.reducer;
