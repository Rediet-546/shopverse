import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import '../../styles/input.css';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  label,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  icon = null,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}

        {error && (
          <span className="input-error-icon">
            <FaExclamationCircle />
          </span>
        )}
      </div>

      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;