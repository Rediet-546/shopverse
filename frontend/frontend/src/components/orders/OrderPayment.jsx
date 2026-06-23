import React from 'react';
import { FaCreditCard, FaPaypal, FaBank, FaMoneyBillWave, FaCheck, FaTimes } from 'react-icons/fa';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const OrderPayment = ({ order }) => {
  if (!order) return null;

  const { payment } = order;

  const getPaymentIcon = () => {
    switch (payment?.method) {
      case 'card':
        return <FaCreditCard />;
      case 'paypal':
        return <FaPaypal />;
      case 'bank_transfer':
        return <FaBank />;
      case 'cod':
        return <FaMoneyBillWave />;
      default:
        return <FaCreditCard />;
    }
  };

  const getPaymentMethodLabel = () => {
    switch (payment?.method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadge = () => {
    const status = payment?.status || 'pending';
    const config = {
      paid: { label: 'Paid', className: 'status-paid', icon: <FaCheck /> },
      pending: { label: 'Pending', className: 'status-pending', icon: <FaClock /> },
      failed: { label: 'Failed', className: 'status-failed', icon: <FaTimes /> },
      refunded: { label: 'Refunded', className: 'status-refunded', icon: <FaTimes /> }
    };

    const statusConfig = config[status] || config.pending;
    return (
      <span className={`payment-status-badge ${statusConfig.className}`}>
        {statusConfig.icon} {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="order-payment">
      <div className="payment-header">
        <h3>Payment Information</h3>
        {getStatusBadge()}
      </div>

      <div className="payment-grid">
        <div className="payment-method">
          <h4>Payment Method</h4>
          <div className="method-details">
            <div className="method-icon">
              {getPaymentIcon()}
            </div>
            <div className="method-info">
              <span className="method-name">{getPaymentMethodLabel()}</span>
              {payment?.method === 'card' && payment?.last4 && (
                <span className="card-details">
                  **** **** **** {payment.last4}
                  {payment?.cardBrand && ` (${payment.cardBrand})`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="payment-details">
          <h4>Payment Details</h4>
          <div className="detail-row">
            <span className="label">Transaction ID</span>
            <span className="value">{payment?.transactionId || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment Date</span>
            <span className="value">
              {payment?.paymentDate 
                ? formatDate(payment.paymentDate, 'MMM DD, YYYY HH:mm')
                : 'N/A'}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Total Amount</span>
            <span className="value amount">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {payment?.method === 'card' && payment?.billingAddress && (
          <div className="billing-address">
            <h4>Billing Address</h4>
            <div className="address-details">
              <p>{payment.billingAddress.street}</p>
              <p>{payment.billingAddress.city}, {payment.billingAddress.state} {payment.billingAddress.zipCode}</p>
              <p>{payment.billingAddress.country}</p>
            </div>
          </div>
        )}

        {payment?.status === 'refunded' && (
          <div className="refund-info">
            <h4>Refund Information</h4>
            <div className="refund-details">
              <div className="detail-row">
                <span className="label">Refund Amount</span>
                <span className="value">{formatCurrency(payment.refundAmount || order.totalAmount)}</span>
              </div>
              {payment?.refundDate && (
                <div className="detail-row">
                  <span className="label">Refund Date</span>
                  <span className="value">{formatDate(payment.refundDate, 'MMM DD, YYYY HH:mm')}</span>
                </div>
              )}
              {payment?.refundReason && (
                <div className="detail-row">
                  <span className="label">Reason</span>
                  <span className="value">{payment.refundReason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="payment-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="summary-row discount">
            <span>Discount</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="summary-row">
          <span>Tax</span>
          <span>{formatCurrency(order.tax)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderPayment;