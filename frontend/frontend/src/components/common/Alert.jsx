import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';
import '../../styles/alert.css';

const Alert = ({
  type = 'info',
  message,
  title,
  onClose,
  dismissible = true,
  autoClose = false,
  autoCloseTime = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const typeClass = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  const iconMap = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle
  };

  const Icon = iconMap[type];

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`alert ${typeClass[type]} ${className}`}>
      <div className="alert-content">
        <Icon className="alert-icon" />
        <div className="alert-text">
          {title && <h4 className="alert-title">{title}</h4>}
          <p className="alert-message">{message}</p>
        </div>
        {dismissible && (
          <button className="alert-dismiss" onClick={handleClose}>
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;