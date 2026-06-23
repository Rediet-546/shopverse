import React from 'react';
import { 
  FaClock, 
  FaCheck, 
  FaShippingFast, 
  FaBox, 
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import '../../styles/orders.css';

const OrderStatusBadge = ({ status, size = 'small' }) => {
  const statusConfig = {
    pending: {
      icon: FaClock,
      label: 'Pending',
      color: '#f6ad55',
      bgColor: '#fefcbf'
    },
    confirmed: {
      icon: FaCheck,
      label: 'Confirmed',
      color: '#4299e1',
      bgColor: '#bee3f8'
    },
    processing: {
      icon: FaSpinner,
      label: 'Processing',
      color: '#667eea',
      bgColor: '#e0e7ff'
    },
    shipped: {
      icon: FaShippingFast,
      label: 'Shipped',
      color: '#48bb78',
      bgColor: '#c6f6d5'
    },
    delivered: {
      icon: FaCheckCircle,
      label: 'Delivered',
      color: '#38a169',
      bgColor: '#9ae6b4'
    },
    cancelled: {
      icon: FaTimes,
      label: 'Cancelled',
      color: '#fc8181',
      bgColor: '#fed7d7'
    },
    refunded: {
      icon: FaExclamationTriangle,
      label: 'Refunded',
      color: '#a0aec0',
      bgColor: '#e2e8f0'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'badge-small',
    medium: 'badge-medium',
    large: 'badge-large'
  };

  return (
    <span 
      className={`order-status-badge ${sizeClasses[size]}`}
      style={{
        background: config.bgColor,
        color: config.color
      }}
    >
      <Icon className="badge-icon" />
      <span className="badge-label">{config.label}</span>
    </span>
  );
};

export default OrderStatusBadge;