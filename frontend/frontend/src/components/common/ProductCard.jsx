import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import { addToCart } from '../../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import Rating from './Rating';
import Button from './Button';
import '../../styles/productcard.css';

const ProductCard = ({ product, onWishlistToggle, isInWishlist }) => {
  const dispatch = useDispatch();

  const {
    _id,
    name,
    description,
    price,
    discount,
    finalPrice,
    images,
    ratings,
    stockQuantity,
    isActive,
    vendorId,
    category
  } = product;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await dispatch(addToCart({ productId: _id, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(_id);
    }
  };

  const imageUrl = images?.[0]?.url || '/placeholder-product.jpg';
  const isOutOfStock = stockQuantity <= 0 || !isActive;
  const hasDiscount = discount > 0;

  return (
    <Link to={`/products/${_id}`} className="product-card">
      <div className="product-card-image">
        <img 
          src={imageUrl} 
          alt={name} 
          loading="lazy"
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
          }}
        />
        
        {isOutOfStock && (
          <div className="product-stock-badge">Out of Stock</div>
        )}
        
        {hasDiscount && (
          <div className="product-discount-badge">
            -{Math.round(discount)}%
          </div>
        )}
        
        <button 
          className="wishlist-btn"
          onClick={handleWishlistToggle}
          aria-label="Add to wishlist"
        >
          {isInWishlist ? <FaHeart className="wishlist-active" /> : <FaRegHeart />}
        </button>
      </div>

      <div className="product-card-content">
        <div className="product-category">{category}</div>
        <h3 className="product-name">{name}</h3>
        
        <div className="product-rating">
          <Rating value={ratings?.average} count={ratings?.count} />
        </div>

        <p className="product-description">
          {description?.substring(0, 60)}...
        </p>

        <div className="product-price">
          <span className="price-current">${finalPrice?.toFixed(2)}</span>
          {hasDiscount && (
            <span className="price-original">${price?.toFixed(2)}</span>
          )}
        </div>

        <Button
          variant="primary"
          size="small"
          fullWidth
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="add-to-cart-btn"
        >
          <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;