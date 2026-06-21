import React from 'react';
import { FaLock, FaGift, FaArrowRight, FaCreditCard, FaShieldAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/cart.css';

const CartSummary = ({ 
  subtotal, 
  discount, 
  tax, 
  shippingCost, 
  total, 
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  couponInput,
  setCouponInput,
  applyingCoupon,
  isLoading,
  isAuthenticated
}) => {
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    onApplyCoupon();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onApplyCoupon();
    }
  };

  return (
    <div className="cart-summary">
      <h2>Order Summary</h2>
      
      <div className="summary-items">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="summary-row discount">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="summary-row">
          <span>Tax (10%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="summary-row">
          <span>Shipping</span>
          <span>
            {shippingCost === 0 ? (
              <span className="free-shipping">Free</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>

        {shippingCost > 0 && (
          <div className="free-shipping-note">
            <p>Add ${(50 - subtotal).toFixed(2)} more for free shipping!</p>
            <div className="shipping-progress">
              <div 
                className="shipping-progress-bar" 
                style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="summary-row total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {couponCode && (
        <div className="applied-coupon">
          <FaGift />
          <span>Coupon: <strong>{couponCode}</strong></span>
          <button 
            onClick={onRemoveCoupon} 
            className="remove-coupon"
            disabled={isLoading}
          >
            Remove
          </button>
        </div>
      )}

      <form className="coupon-section" onSubmit={handleApplyCoupon}>
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!!couponCode || applyingCoupon || isLoading}
        />
        <button
          type="submit"
          className="apply-coupon-btn"
          disabled={!!couponCode || applyingCoupon || !couponInput.trim() || isLoading}
        >
          {applyingCoupon ? 'Applying...' : 'Apply'}
        </button>
      </form>

      <button 
        className="checkout-btn" 
        onClick={onCheckout}
        disabled={isLoading}
      >
        <FaLock /> 
        {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
        <FaArrowRight />
      </button>

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>
            Already have an account? <Link to="/login" state={{ from: '/cart' }}>Login</Link>
          </p>
        </div>
      )}

      <div className="payment-methods">
        <p className="secure-checkout">
          <FaShieldAlt /> Secure Checkout
        </p>
        <div className="payment-icons">
          <span className="payment-icon visa">Visa</span>
          <span className="payment-icon mastercard">Mastercard</span>
          <span className="payment-icon paypal">PayPal</span>
          <span className="payment-icon stripe">Stripe</span>
          <span className="payment-icon applepay">Apple Pay</span>
        </div>
        <p className="secure-text">
          <FaCreditCard /> Your payment information is encrypted and secure
        </p>
      </div>
    </div>
  );
};

export default CartSummary;