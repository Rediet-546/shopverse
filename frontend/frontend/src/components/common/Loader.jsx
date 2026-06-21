import React from 'react';
import '../../styles/loader.css';

const Loader = ({ 
  size = 'medium', 
  fullPage = false, 
  text = 'Loading...' 
}) => {
  const sizeClass = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  const loaderContent = (
    <div className="loader-container">
      <div className={`loader ${sizeClass[size]}`}>
        <div className="loader-spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loader-fullpage">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

// Spinner component for buttons
export const Spinner = ({ size = 'small' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return <div className={`spinner ${sizeClass[size]}`}></div>;
};

// Skeleton loader for cards
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
            <div className="skeleton-line skeleton-price"></div>
            <div className="skeleton-line skeleton-button"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Loader;