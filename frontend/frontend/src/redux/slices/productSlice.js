import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  products: [],
  currentProduct: null,
  vendorProducts: [],
  isLoading: false,
  error: null,
  total: 0,
  pages: 0
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProduct(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productsAPI.createProduct(productData);
      toast.success('Product created successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create product';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.updateProduct(id, productData);
      toast.success('Product updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productsAPI.deleteProduct(id);
      toast.success('Product deleted successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const toggleProductStatus = createAsyncThunk(
  'products/toggleProductStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.updateProduct(id, { isActive });
      toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchVendorProducts = createAsyncThunk(
  'products/fetchVendorProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProductsByVendor(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vendor products');
    }
  }
);

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products || [];
        state.total = action.payload.pagination?.total || 0;
        state.pages = action.payload.pagination?.pages || 0;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.product || action.payload;
        state.error = null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentProduct } = productSlice.actions;

export default productSlice.reducer;