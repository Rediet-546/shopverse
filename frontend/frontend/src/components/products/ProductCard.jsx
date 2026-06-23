import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaCopy,
  FaToggleOn,
  FaToggleOff,
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/products.css';

const ProductCard = ({
  product,
  viewMode = 'grid',
  isSelected = false,
  onSelect = null,
  onDelete = null,
  onToggleStatus = null,
  showActions = false,
  onWishlistToggle = null,
  isInWishlist = false
}) => {
  const dispatch = useDispatch();
  const [isImageLoading, setIsImageLoading] = useState(true);

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
    category,
    vendorId,
    sales = 0
  } = product;

  const isOutOfStock = stockQuantity <= 0 || !isActive;
  const hasDiscount = discount > 0;
  const imageUrl = images?.[0]?.url || '/placeholder-product.jpg';
  const ratingValue = ratings?.average || 0;
  const ratingCount = ratings?.count || 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

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

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star-filled" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="star-half" className="star-half" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`star-empty-${i}`} className="star-empty" />);
    }

    return stars;
  };

  if (viewMode === 'list') {
    return (
      <div className={`product-card-list ${isSelected ? 'selected' : ''}`}>
        {onSelect && (
          <div className="product-select">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(_id)}
              className="product-checkbox"
            />
          </div>
        )}
        
        <div className="product-image-wrapper">
          <img 
            src={imageUrl} 
            alt={name}
            className={`product-image ${isImageLoading ? 'loading' : ''}`}
            onLoad={() => setIsImageLoading(false)}
          />
          {isOutOfStock && (
            <div className="stock-badge out-of-stock">Out of Stock</div>
          )}
          {hasDiscount && (
            <div className="discount-badge">-{Math.round(discount)}%</div>
          )}
        </div>

        <div className="product-info">
          <div className="product-header">
            <Link to={`/products/${_id}`} className="product-name">
              {name}
            </Link>
            {showActions && (
              <div className="product-actions">
                <Link to={`/products/${_id}`} className="action-btn" title="View">
                  <FaEye />
                </Link>
                <Link to={`/vendor/products/edit/${_id}`} className="action-btn" title="Edit">
                  <FaEdit />
                </Link>
                <button 
                  className="action-btn" 
                  onClick={() => onToggleStatus && onToggleStatus(_id)}
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? <FaToggleOn className="active" /> : <FaToggleOff />}
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={() => onDelete && onDelete(_id)}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          <div className="product-meta">
            <span className="product-category">{category}</span>
            <span className="product-vendor">by {vendorId?.name || 'ShopVerse'}</span>
          </div>

          <p className="product-description">{description?.substring(0, 150)}...</p>

          <div className="product-rating">
            <div className="stars">{renderStars()}</div>
            <span className="rating-value">{ratingValue.toFixed(1)}</span>
            <span className="rating-count">({ratingCount} reviews)</span>
          </div>

          <div className="product-footer">
            <div className="product-price">
              <span className="price-current">{formatCurrency(finalPrice)}</span>
              {hasDiscount && (
                <span className="price-original">{formatCurrency(price)}</span>
              )}
            </div>
            <div className="product-stats">
              <span className="sales-count">{sales} sold</span>
              <span className="stock-status">
                {isOutOfStock ? (
                  <span className="out-of-stock-text">Out of Stock</span>
                ) : stockQuantity < 10 ? (
                  <span className="low-stock-text">Low Stock</span>
                ) : (
                  <span className="in-stock-text">In Stock</span>
                )}
              </span>
            </div>
            <button 
              className="btn btn-primary add-to-cart"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={`product-card-grid ${isSelected ? 'selected' : ''}`}>
      {onSelect && (
        <div className="product-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(_id)}
            className="product-checkbox"
          />
        </div>
      )}

      <Link to={`/products/${_id}`} className="product-card-link">
        <div className="product-image-wrapper">
          <img 
            src={imageUrl} 
            alt={name}
            className={`product-image ${isImageLoading ? 'loading' : ''}`}
            onLoad={() => setIsImageLoading(false)}
          />
          {isOutOfStock && (
            <div className="stock-badge out-of-stock">Out of Stock</div>
          )}
          {hasDiscount && (
            <div className="discount-badge">-{Math.round(discount)}%</div>
          )}
          
          <button 
            className="wishlist-btn"
            onClick={handleWishlistToggle}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist ? <FaHeart className="wishlist-active" /> : <FaRegHeart />}
          </button>
        </div>

        <div className="product-content">
          <div className="product-category">{category}</div>
          <h3 className="product-name">{name}</h3>
          
          <div className="product-rating">
            <div className="stars">{renderStars()}</div>
            <span className="rating-count">({ratingCount})</span>
          </div>

          <div className="product-price">
            <span className="price-current">{formatCurrency(finalPrice)}</span>
            {hasDiscount && (
              <span className="price-original">{formatCurrency(price)}</span>
            )}
          </div>

          <div className="product-actions-grid">
            <button 
              className={`btn btn-primary add-to-cart ${isOutOfStock ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {showActions && (
              <div className="admin-actions">
                <Link to={`/vendor/products/edit/${_id}`} className="action-btn" title="Edit">
                  <FaEdit />
                </Link>
                <button 
                  className="action-btn" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleStatus && onToggleStatus(_id);
                  }}
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? <FaToggleOn className="active" /> : <FaToggleOff />}
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;