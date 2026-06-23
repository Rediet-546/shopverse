import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import productReducer from './slices/productSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'auth/login/fulfilled',
          'auth/register/fulfilled',
          'cart/fetchCart/fulfilled',
          'orders/fetchOrders/fulfilled',
          'products/fetchProducts/fulfilled'
        ],
        ignoredActionPaths: ['payload.timestamp', 'meta.arg'],
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.updatedAt',
          'orders.currentOrder.createdAt',
          'products.currentProduct.createdAt'
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;