import React from 'react';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/cart.css';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const { 
    productId, 
    name, 
    image, 
    quantity, 
    priceSnapshot, 
    variant 
  } = item;

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Remove this item from cart?')) {
      onRemove(productId);
    }
  };

  // Calculate item total
  const itemTotal = priceSnapshot.finalPrice * quantity;
  const originalTotal = priceSnapshot.price * quantity;
  const hasDiscount = priceSnapshot.discount > 0;

  return (
    <div className="cart-item">
      <div className="item-image">
        <Link to={`/products/${productId}`}>
          <img 
            src={image || '/placeholder-product.jpg'} 
            alt={name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/placeholder-product.jpg';
            }}
          />
        </Link>
      </div>
      
      <div className="item-details">
        <Link to={`/products/${productId}`} className="item-name">
          {name}
        </Link>
        
        {variant && Object.keys(variant).length > 0 && (
          <div className="item-variant">
            {Object.entries(variant).map(([key, value]) => (
              <span key={key} className="variant-tag">
                {key}: {value}
              </span>
            ))}
          </div>
        )}
        
        <div className="item-price">
          {hasDiscount ? (
            <>
              <span className="original-price">
                ${originalTotal.toFixed(2)}
              </span>
              <span className="discount-price">
                ${itemTotal.toFixed(2)}
              </span>
              <span className="discount-badge">
                -{Math.round(priceSnapshot.discount)}%
              </span>
            </>
          ) : (
            <span className="regular-price">
              ${itemTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="item-quantity">
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <FaMinus />
        </button>
        <span className="qty-value">{quantity}</span>
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity + 1)}
          aria-label="Increase quantity"
        >
          <FaPlus />
        </button>
      </div>

      <div className="item-total">
        <span className="total-label">Total</span>
        <span className="total-value">${itemTotal.toFixed(2)}</span>
      </div>

      <button
        className="remove-btn"
        onClick={handleRemove}
        aria-label="Remove item"
        title="Remove item"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default CartItem;