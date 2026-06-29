import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../api';
import { toast } from 'react-hot-toast';

const initialState = {
  users: [],
  currentUser: null,
  addresses: [],
  isLoading: false,
  error: null,
  total: 0,
  pages: 0
};

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getAllUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchAddresses = createAsyncThunk(
  'users/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getAddresses();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }
);

export const addAddress = createAsyncThunk(
  'users/addAddress',
  async (address, { rejectWithValue }) => {
    try {
      const response = await usersAPI.addAddress(address);
      toast.success('Address added successfully');
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add address';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'users/updateAddress',
  async ({ addressId, address }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateAddress(addressId, address);
      toast.success('Address updated successfully');
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update address';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'users/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await usersAPI.deleteAddress(addressId);
      toast.success('Address deleted successfully');
      return addressId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete address';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const getAddressList = (payload) => payload.addresses || payload.data?.addresses || payload.data || payload || [];

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users || action.payload.data?.users || action.payload.data || [];
        state.total = action.payload.pagination?.total || state.users.length;
        state.pages = action.payload.pagination?.pages || 0;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = getAddressList(action.payload);
        state.error = null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        const address = action.payload.address || action.payload.data?.address || action.payload.data || action.payload;
        state.addresses = [...state.addresses, address];
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const address = action.payload.address || action.payload.data?.address || action.payload.data || action.payload;
        state.addresses = state.addresses.map((item) =>
          (item._id || item.id) === (address._id || address.id) ? address : item
        );
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((address) => (address._id || address.id) !== action.payload);
      });
  }
});

export const { clearError } = userSlice.actions;

export default userSlice.reducer;
