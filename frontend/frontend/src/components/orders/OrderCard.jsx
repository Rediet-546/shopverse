import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaCalendarAlt, 
  FaCreditCard,
  FaChevronRight,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { formatDate, formatCurrency } from '../../utils/helpers';
import OrderStatusBadge from './OrderStatusBadge';
import '../../styles/orders.css';

const OrderCard = ({ 
  order, 
  isSelected = false, 
  onSelect = null,
  showSelect = false
}) => {
  const {
    _id,
    orderNumber,
    createdAt,
    totalAmount,
    status,
    items,
    payment
  } = order;

  const itemCount = items?.length || 0;

  return (
    <div className={`order-card ${isSelected ? 'selected' : ''}`}>
      {showSelect && onSelect && (
        <div className="order-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(_id)}
            className="order-checkbox"
          />
        </div>
      )}

      <Link to={`/orders/${_id}`} className="order-card-link">
        <div className="order-card-header">
          <div className="order-number">
            <FaBox className="order-icon" />
            <span className="number">#{orderNumber}</span>
          </div>
          <div className="order-date">
            <FaCalendarAlt />
            <span>{formatDate(createdAt, 'MMM DD, YYYY')}</span>
          </div>
        </div>

        <div className="order-card-body">
          <div className="order-items-preview">
            <div className="items-summary">
              <span className="item-count">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
              <span className="item-divider">•</span>
              <span className="item-total">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="items-thumbnails">
              {items?.slice(0, 3).map((item, index) => (
                <div key={index} className="item-thumbnail">
                  <img 
                    src={item.image || '/placeholder-product.jpg'} 
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
              ))}
              {itemCount > 3 && (
                <div className="item-more">+{itemCount - 3}</div>
              )}
            </div>
          </div>

          <div className="order-card-footer">
            <div className="order-status">
              <OrderStatusBadge status={status} />
            </div>
            <div className="order-payment">
              <FaCreditCard />
              <span className={`payment-status ${payment?.status}`}>
                {payment?.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Pending'}
              </span>
            </div>
            <div className="order-action">
              <FaChevronRight />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default OrderCard;