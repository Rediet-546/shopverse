import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { fetchCart } from '../../redux/slices/cartSlice';
import '../../styles/cart.css';

const CartIcon = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const itemCount = items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <Link to="/cart" className="cart-icon-wrapper">
      <div className="cart-icon">
        <FaShoppingCart />
        {itemCount > 0 && (
          <span className="cart-badge">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default CartIcon;