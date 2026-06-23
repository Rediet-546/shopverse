import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaCreditCard, 
  FaTruck, 
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { formatDate, formatCurrency } from '../../utils/helpers';
import OrderStatusBadge from './OrderStatusBadge';
import '../../styles/orders.css';

const OrderSummary = ({ order, compact = false }) => {
  if (!order) return null;

  const {
    orderNumber,
    createdAt,
    totalAmount,
    status,
    items,
    payment,
    shipping
  } = order;

  const itemCount = items?.length || 0;
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'pending';

  const getStatusIcon = () => {
    if (isDelivered) return <FaCheckCircle className="status-icon delivered" />;
    if (isCancelled) return <FaExclamationTriangle className="status-icon cancelled" />;
    if (isPending) return <FaClock className="status-icon pending" />;
    return <FaBox className="status-icon default" />;
  };

  if (compact) {
    return (
      <div className="order-summary-compact">
        <div className="summary-row">
          <span className="label">Order #</span>
          <span className="value">#{orderNumber}</span>
        </div>
        <div className="summary-row">
          <span className="label">Date</span>
          <span className="value">{formatDate(createdAt, 'MMM DD, YYYY')}</span>
        </div>
        <div className="summary-row">
          <span className="label">Total</span>
          <span className="value">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="summary-row">
          <span className="label">Status</span>
          <OrderStatusBadge status={status} size="small" />
        </div>
        <div className="summary-row">
          <span className="label">Items</span>
          <span className="value">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="order-summary">
      <div className="summary-header">
        <div className="order-number">
          <FaBox className="header-icon" />
          <h3>Order #{orderNumber}</h3>
        </div>
        <div className="order-status">
          {getStatusIcon()}
          <OrderStatusBadge status={status} size="medium" />
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-section">
          <h4>
            <FaCalendarAlt className="section-icon" />
            Order Details
          </h4>
          <div className="detail-row">
            <span className="label">Placed on</span>
            <span className="value">{formatDate(createdAt, 'MMMM DD, YYYY')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Last Updated</span>
            <span className="value">{formatDate(order.updatedAt, 'MMMM DD, YYYY')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total Items</span>
            <span className="value">{itemCount}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total Amount</span>
            <span className="value amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="summary-section">
          <h4>
            <FaCreditCard className="section-icon" />
            Payment Information
          </h4>
          <div className="detail-row">
            <span className="label">Method</span>
            <span className="value">{payment?.method ? payment.method.toUpperCase() : 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status</span>
            <span className={`value payment-${payment?.status || 'pending'}`}>
              {payment?.status ? payment.status.toUpperCase() : 'Pending'}
            </span>
          </div>
          {payment?.transactionId && (
            <div className="detail-row">
              <span className="label">Transaction ID</span>
              <span className="value transaction-id">{payment.transactionId}</span>
            </div>
          )}
          {payment?.paymentDate && (
            <div className="detail-row">
              <span className="label">Payment Date</span>
              <span className="value">{formatDate(payment.paymentDate, 'MMMM DD, YYYY')}</span>
            </div>
          )}
        </div>

        <div className="summary-section">
          <h4>
            <FaTruck className="section-icon" />
            Shipping Information
          </h4>
          <div className="detail-row">
            <span className="label">Method</span>
            <span className="value">{shipping?.method || 'Standard'}</span>
          </div>
          {shipping?.trackingNumber && (
            <div className="detail-row">
              <span className="label">Tracking #</span>
              <span className="value tracking-number">{shipping.trackingNumber}</span>
            </div>
          )}
          {shipping?.carrier && (
            <div className="detail-row">
              <span className="label">Carrier</span>
              <span className="value">{shipping.carrier}</span>
            </div>
          )}
          {shipping?.estimatedDelivery && (
            <div className="detail-row">
              <span className="label">Est. Delivery</span>
              <span className="value">{formatDate(shipping.estimatedDelivery, 'MMMM DD, YYYY')}</span>
            </div>
          )}
          {shipping?.address && (
            <div className="shipping-address">
              <p>{shipping.address.street}</p>
              <p>{shipping.address.city}, {shipping.address.state} {shipping.address.zipCode}</p>
              <p>{shipping.address.country}</p>
            </div>
          )}
        </div>
      </div>

      {order.notes && (
        <div className="summary-notes">
          <h4>Order Notes</h4>
          <p>{order.notes}</p>
        </div>
      )}

      <div className="summary-footer">
        <Link to={`/orders/${order._id}`} className="btn btn-primary">
          View Full Details
        </Link>
        {!isDelivered && !isCancelled && (
          <button className="btn btn-outline">
            Contact Support
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;