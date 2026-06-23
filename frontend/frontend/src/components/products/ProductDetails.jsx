import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaRegHeart,
  FaShare,
  FaStar,
  FaTruck,
  FaUndo,
  FaShieldAlt,
  FaTag,
  FaArrowLeft,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchProduct } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleWishlist } from '../../redux/slices/wishlistSlice';
import ProductGallery from './ProductGallery';
import ProductReviews from './ProductReviews';
import ProductVariants from './ProductVariants';
import QuantitySelector from '../common/QuantitySelector';
import Loader from '../common/Loader';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/products.css';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct: product, isLoading } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (product && wishlistItems) {
      setIsInWishlist(wishlistItems.some(item => item._id === product._id));
    }
  }, [product, wishlistItems]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    try {
      await dispatch(addToCart({ 
        productId: product._id, 
        quantity, 
        variant: selectedVariant || {} 
      })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    try {
      await dispatch(toggleWishlist(product._id)).unwrap();
      setIsInWishlist(!isInWishlist);
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error(error || 'Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on ShopVerse!`,
          url: url
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleAddReview = async (productId, reviewData) => {
    // This would dispatch an addReview action
    toast.success('Review submitted successfully!');
  };

  if (isLoading || !product) {
    return <Loader fullPage text="Loading product..." />;
  }

  const isOutOfStock = product.stockQuantity <= 0 || !product.isActive;
  const hasDiscount = product.discount > 0;
  const shortDescription = product.description?.length > 300 
    ? product.description.substring(0, 300) + '...' 
    : product.description;

  return (
    <div className="product-details-page">
      <div className="product-details-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span className="current">{product.name}</span>
        </div>

        <div className="product-details-grid">
          {/* Gallery */}
          <div className="product-gallery-col">
            <ProductGallery images={product.images} />
          </div>

          {/* Info */}
          <div className="product-info-col">
            <div className="product-header">
              <span className="product-category">{product.category}</span>
              <h1 className="product-title">{product.name}</h1>
              <div className="product-rating">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar 
                      key={star} 
                      className={star <= Math.round(product.ratings?.average || 0) ? 'filled' : 'empty'} 
                    />
                  ))}
                </div>
                <span className="rating-value">{product.ratings?.average?.toFixed(1)}</span>
                <span className="rating-count">({product.ratings?.count || 0} reviews)</span>
                <span className="sales-count">{product.sales || 0} sold</span>
              </div>
            </div>

            <div className="product-price-section">
              <div className="price-wrapper">
                <span className="current-price">{formatCurrency(product.finalPrice)}</span>
                {hasDiscount && (
                  <>
                    <span className="original-price">{formatCurrency(product.price)}</span>
                    <span className="discount-badge">-{Math.round(product.discount)}%</span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <div className="savings-info">
                  <FaTag /> Save {formatCurrency(product.price - product.finalPrice)}
                </div>
              )}
            </div>

            <div className="product-short-description">
              <p>{shortDescription}</p>
              {product.description?.length > 300 && (
                <button 
                  className="read-more-btn"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                  {showFullDescription ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              )}
              {showFullDescription && (
                <div className="full-description">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* Variants */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <ProductVariants 
                attributes={product.attributes}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            )}

            {/* Quantity & Add to Cart */}
            <div className="product-actions">
              <div className="quantity-section">
                <label>Quantity</label>
                <QuantitySelector 
                  value={quantity}
                  onChange={setQuantity}
                  max={product.stockQuantity}
                  disabled={isOutOfStock}
                />
                <span className="stock-info">
                  {isOutOfStock ? (
                    <span className="out-of-stock">Out of Stock</span>
                  ) : product.stockQuantity < 10 ? (
                    <span className="low-stock">Only {product.stockQuantity} left in stock</span>
                  ) : (
                    <span className="in-stock">In Stock</span>
                  )}
                </span>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  className="btn wishlist-btn"
                  onClick={handleWishlistToggle}
                  aria-label="Wishlist"
                >
                  {isInWishlist ? <FaHeart className="active" /> : <FaRegHeart />}
                </button>
                <button 
                  className="btn share-btn"
                  onClick={handleShare}
                  aria-label="Share"
                >
                  <FaShare />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="product-features">
              <div className="feature-item">
                <FaTruck />
                <div>
                  <span>Free Shipping</span>
                  <small>On orders over $50</small>
                </div>
              </div>
              <div className="feature-item">
                <FaUndo />
                <div>
                  <span>30-Day Returns</span>
                  <small>Hassle-free returns</small>
                </div>
              </div>
              <div className="feature-item">
                <FaShieldAlt />
                <div>
                  <span>Secure Checkout</span>
                  <small>100% secure payment</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.reviews?.length || 0})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === 'description' && (
              <div className="tab-description">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews 
                productId={product._id}
                reviews={product.reviews}
                onAddReview={handleAddReview}
              />
            )}

            {activeTab === 'specifications' && (
              <div className="tab-specifications">
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td>Category</td>
                      <td>{product.category}</td>
                    </tr>
                    {product.subCategory && (
                      <tr>
                        <td>Sub Category</td>
                        <td>{product.subCategory}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Price</td>
                      <td>{formatCurrency(product.price)}</td>
                    </tr>
                    {product.discount > 0 && (
                      <tr>
                        <td>Discount</td>
                        <td>{product.discount}%</td>
                      </tr>
                    )}
                    <tr>
                      <td>Stock</td>
                      <td>{product.stockQuantity} units</td>
                    </tr>
                    {product.attributes?.material && (
                      <tr>
                        <td>Material</td>
                        <td>{product.attributes.material}</td>
                      </tr>
                    )}
                    {product.attributes?.weight && (
                      <tr>
                        <td>Weight</td>
                        <td>{product.attributes.weight} kg</td>
                      </tr>
                    )}
                    {product.shippingCost !== undefined && (
                      <tr>
                        <td>Shipping</td>
                        <td>{product.isFreeShipping ? 'Free' : formatCurrency(product.shippingCost)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Vendor</td>
                      <td>{product.vendorId?.name || 'ShopVerse'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;