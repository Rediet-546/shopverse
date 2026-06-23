import React, { useState } from 'react';
import { FaMapMarkerAlt, FaTruck, FaBox, FaClock, FaEdit } from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';
import '../../styles/orders.css';

const OrderShipping = ({ order }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order?.shipping?.trackingNumber || '');
  const [carrier, setCarrier] = useState(order?.shipping?.carrier || '');

  if (!order) return null;

  const { shipping, status } = order;

  const handleUpdateTracking = () => {
    // In a real app, this would update the tracking info
    setIsEditing(false);
    // toast.success('Tracking info updated');
  };

  const getShippingStatus = () => {
    if (status === 'delivered') return 'Delivered';
    if (status === 'shipped') return 'In Transit';
    if (status === 'processing') return 'Preparing to Ship';
    return 'Not Shipped';
  };

  const getStatusIcon = () => {
    if (status === 'delivered') return <FaBox className="shipping-icon delivered" />;
    if (status === 'shipped') return <FaTruck className="shipping-icon shipped" />;
    return <FaClock className="shipping-icon pending" />;
  };

  return (
    <div className="order-shipping">
      <div className="shipping-header">
        <h3>Shipping Information</h3>
        <span className="shipping-status">
          {getStatusIcon()}
          {getShippingStatus()}
        </span>
      </div>

      <div className="shipping-grid">
        <div className="shipping-address">
          <h4>
            <FaMapMarkerAlt /> Shipping Address
          </h4>
          <div className="address-details">
            <p>{shipping?.address?.street}</p>
            <p>{shipping?.address?.city}, {shipping?.address?.state} {shipping?.address?.zipCode}</p>
            <p>{shipping?.address?.country}</p>
          </div>
        </div>

        <div className="shipping-details">
          <h4>Shipping Details</h4>
          <div className="detail-row">
            <span className="label">Method</span>
            <span className="value">{shipping?.method || 'Standard Shipping'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Estimated Delivery</span>
            <span className="value">
              {shipping?.estimatedDelivery 
                ? formatDate(shipping.estimatedDelivery, 'MMM DD, YYYY')
                : 'Not available'}
            </span>
          </div>
          {shipping?.shippedDate && (
            <div className="detail-row">
              <span className="label">Shipped Date</span>
              <span className="value">{formatDate(shipping.shippedDate, 'MMM DD, YYYY')}</span>
            </div>
          )}
          {shipping?.deliveredDate && (
            <div className="detail-row">
              <span className="label">Delivered Date</span>
              <span className="value">{formatDate(shipping.deliveredDate, 'MMM DD, YYYY')}</span>
            </div>
          )}
        </div>

        <div className="shipping-tracking">
          <h4>
            <FaTruck /> Tracking Information
          </h4>
          {isEditing ? (
            <div className="tracking-edit">
              <input
                type="text"
                placeholder="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="tracking-input"
              />
              <input
                type="text"
                placeholder="Carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="tracking-input"
              />
              <div className="tracking-actions">
                <button className="btn btn-primary" onClick={handleUpdateTracking}>
                  Save
                </button>
                <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="tracking-info">
              {shipping?.trackingNumber ? (
                <>
                  <div className="tracking-number">
                    <span className="label">Tracking #:</span>
                    <span className="value">{shipping.trackingNumber}</span>
                  </div>
                  {shipping?.carrier && (
                    <div className="tracking-carrier">
                      <span className="label">Carrier:</span>
                      <span className="value">{shipping.carrier}</span>
                    </div>
                  )}
                  <button 
                    className="tracking-link"
                    onClick={() => window.open(`https://www.google.com/search?q=track+${shipping.trackingNumber}`, '_blank')}
                  >
                    Track Package
                  </button>
                </>
              ) : (
                <p className="no-tracking">No tracking information available</p>
              )}
              {(order.status === 'shipped' || order.status === 'processing') && (
                <button 
                  className="edit-tracking-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit /> Update Tracking
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderShipping;