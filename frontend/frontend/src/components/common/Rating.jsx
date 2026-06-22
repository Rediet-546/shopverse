import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import '../../styles/rating.css';

const Rating = ({ 
  value, 
  total = 5, 
  size = 'medium', 
  showValue = false,
  showCount = false,
  count = 0,
  readOnly = true,
  onChange,
  className = ''
}) => {
  const sizeClass = {
    small: 'rating-small',
    medium: 'rating-medium',
    large: 'rating-large'
  };

  const renderStar = (index) => {
    const starValue = index + 1;
    
    if (readOnly) {
      if (starValue <= Math.floor(value)) {
        return <FaStar key={index} className="star-filled" />;
      }
      if (starValue - 0.5 <= value) {
        return <FaStarHalfAlt key={index} className="star-half" />;
      }
      return <FaRegStar key={index} className="star-empty" />;
    }

    return (
      <button
        key={index}
        className="star-btn"
        onClick={() => onChange && onChange(starValue)}
        onMouseEnter={() => onChange && onChange(starValue)}
      >
        {starValue <= Math.floor(value) ? (
          <FaStar className="star-filled" />
        ) : starValue - 0.5 <= value ? (
          <FaStarHalfAlt className="star-half" />
        ) : (
          <FaRegStar className="star-empty" />
        )}
      </button>
    );
  };

  return (
    <div className={`rating ${sizeClass[size]} ${className}`}>
      <div className="rating-stars">
        {Array.from({ length: total }).map((_, index) => renderStar(index))}
      </div>
      
      {showValue && (
        <span className="rating-value">{value?.toFixed(1) || '0'}</span>
      )}
      
      {showCount && count > 0 && (
        <span className="rating-count">({count} reviews)</span>
      )}
    </div>
  );
};

export default Rating;