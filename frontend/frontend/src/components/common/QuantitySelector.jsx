// src/components/common/QuantitySelector.jsx
import React from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

const QuantitySelector = ({ value, onChange, min = 1, max = 99, disabled = false }) => {
  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  return (
    <div className="quantity-selector">
      <button
        className="qty-btn"
        onClick={decrement}
        disabled={disabled || value <= min}
      >
        <FaMinus />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="qty-input"
      />
      <button
        className="qty-btn"
        onClick={increment}
        disabled={disabled || value >= max}
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default QuantitySelector;