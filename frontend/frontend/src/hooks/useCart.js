import { useCart as useCartContext } from '../context/CartContext';

/**
 * Custom hook for shopping cart
 * Provides access to cart state and functions
 */
export const useCart = () => {
  const cart = useCartContext();
  return cart;
};

export default useCart;