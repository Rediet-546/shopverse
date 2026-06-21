import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaCheck, FaSpinner } from 'react-icons/fa';
import { addToCart } from '../../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import '../../styles/cart.css';

const AddToCartButton = ({ 
  productId, 
  quantity = 1, 
  variant = {},
  className = '',
  size = 'medium',
  disabled = false,
  onSuccess = null
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(addToCart({ productId, quantity, variant })).unwrap();
      
      setIsAdded(true);
      toast.success('Item added to cart!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
      
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'btn-small';
      case 'large':
        return 'btn-large';
      default:
        return 'btn-medium';
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <FaSpinner className="spinner" />
          Adding...
        </>
      );
    }
    if (isAdded) {
      return (
        <>
          <FaCheck /> Added!
        </>
      );
    }
    return (
      <>
        <FaShoppingCart /> Add to Cart
      </>
    );
  };

  return (
    <button
      className={`add-to-cart-btn ${getSizeClass()} ${className} ${isAdded ? 'added' : ''}`}
      onClick={handleAddToCart}
      disabled={disabled || isLoading || isAdded}
      aria-label="Add to cart"
    >
      {getButtonContent()}
    </button>
  );
};

export default AddToCartButton;