// src/components/products/ProductVariants.jsx
import React from 'react';

const ProductVariants = ({ attributes, selectedVariant, onVariantChange }) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  const handleVariantSelect = (key, value) => {
    onVariantChange({
      ...selectedVariant,
      [key]: value
    });
  };

  return (
    <div className="product-variants">
      {attributes.color && attributes.color.length > 0 && (
        <div className="variant-group">
          <label>Color:</label>
          <div className="variant-options">
            {attributes.color.map((color, index) => (
              <button
                key={index}
                className={`variant-btn ${selectedVariant?.color === color ? 'active' : ''}`}
                onClick={() => handleVariantSelect('color', color)}
              >
                <span className="color-dot" style={{ backgroundColor: color.toLowerCase() }}></span>
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {attributes.size && attributes.size.length > 0 && (
        <div className="variant-group">
          <label>Size:</label>
          <div className="variant-options">
            {attributes.size.map((size, index) => (
              <button
                key={index}
                className={`variant-btn ${selectedVariant?.size === size ? 'active' : ''}`}
                onClick={() => handleVariantSelect('size', size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {attributes.material && (
        <div className="variant-group">
          <label>Material:</label>
          <span className="variant-value">{attributes.material}</span>
        </div>
      )}

      {attributes.weight && (
        <div className="variant-group">
          <label>Weight:</label>
          <span className="variant-value">{attributes.weight} kg</span>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;