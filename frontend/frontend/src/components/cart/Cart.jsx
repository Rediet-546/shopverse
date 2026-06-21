import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaShoppingCart,
  FaArrowLeft,
  FaLock,
  FaGift,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { 
  fetchCart, 
  updateQuantity, 
  removeItem, 
  clearCart,
  applyCoupon,
  removeCoupon
} from '../../redux/slices/cartSlice';
import CartSummary from './CartSummary';
import CartItem from './CartItem';
import '../../styles/cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, subtotal, discount, tax, shippingCost, total, couponCode, isLoading, error } = 
    useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      await handleRemoveItem(productId);
      return;
    }
    try {
      await dispatch(updateQuantity({ productId, quantity: newQuantity })).unwrap();
    } catch (error) {
      toast.error(error || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await dispatch(removeItem(productId)).unwrap();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
        toast.success('Cart cleared');
      } catch (error) {
        toast.error('Failed to clear cart');
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      await dispatch(applyCoupon(couponInput.trim())).unwrap();
      toast.success('Coupon applied successfully');
      setCouponInput('');
    } catch (error) {
      toast.error(error || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
      toast.success('Coupon removed');
    } catch (error) {
      toast.error('Failed to remove coupon');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="cart-loading">
        <FaSpinner className="spinner-icon" />
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-error">
        <p>Error loading cart: {error}</p>
        <button onClick={() => dispatch(fetchCart())} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-cart-icon">
          <FaShoppingCart />
        </div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <Link to="/products" className="continue-shopping">
          <FaArrowLeft /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>
          <FaShoppingCart /> Shopping Cart
          <span className="cart-count">{items.length} items</span>
        </h1>
        <Link to="/products" className="continue-shopping">
          <FaArrowLeft /> Continue Shopping
        </Link>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${JSON.stringify(item.variant || {})}`}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}

          <button className="clear-cart-btn" onClick={handleClearCart}>
            <FaTrash /> Clear Cart
          </button>
        </div>

        <CartSummary
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          shippingCost={shippingCost}
          total={total}
          couponCode={couponCode}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          onCheckout={handleCheckout}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          applyingCoupon={applyingCoupon}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

export default Cart;