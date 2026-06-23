import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCheckCircle,
  FaBox,
  FaSearch,
  FaExternalLinkAlt,
  FaSpinner
} from 'react-icons/fa';
import { formatDate, formatDistanceToNow } from '../../utils/helpers';
import '../../styles/orders.css';

// Mock tracking data - in real app, this would come from an API
const mockTrackingData = {
  'TRK123456789': {
    status: 'in_transit',
    carrier: 'UPS',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    currentLocation: 'Chicago, IL',
    lastUpdated: new Date(),
    events: [
      {
        status: 'Delivered',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Package delivered to recipient'
      },
      {
        status: 'Out for Delivery',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        description: 'Package is out for delivery'
      },
      {
        status: 'In Transit',
        location: 'Chicago, IL',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Package arrived at facility'
      },
      {
        status: 'Shipped',
        location: 'Los Angeles, CA',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Package has been shipped'
      }
    ]
  }
};

const OrderTracking = ({ order, onTrack }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const orderTrackingNumber = order?.shipping?.trackingNumber;

  useEffect(() => {
    if (orderTrackingNumber) {
      setTrackingNumber(orderTrackingNumber);
      fetchTracking(orderTrackingNumber);
    }
  }, [orderTrackingNumber]);

  const fetchTracking = async (number) => {
    setIsLoading(true);
    setError(null);
    try {
      // In real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = mockTrackingData[number];
      if (data) {
        setTrackingData(data);
      } else {
        setError('Tracking number not found');
      }
    } catch (err) {
      setError('Failed to fetch tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }
    await fetchTracking(trackingNumber);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="tracking-status-icon delivered" />;
      case 'in_transit':
        return <FaTruck className="tracking-status-icon in-transit" spin />;
      case 'out_for_delivery':
        return <FaBox className="tracking-status-icon out-for-delivery" />;
      default:
        return <FaClock className="tracking-status-icon pending" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'in_transit': return 'In Transit';
      case 'out_for_delivery': return 'Out for Delivery';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#48bb78';
      case 'in_transit': return '#667eea';
      case 'out_for_delivery': return '#f6ad55';
      default: return '#a0aec0';
    }
  };

  return (
    <div className="order-tracking">
      <div className="tracking-header">
        <h3>
          <FaTruck /> Order Tracking
        </h3>
        {orderTrackingNumber && (
          <span className="tracking-number-label">
            Tracking #: {orderTrackingNumber}
          </span>
        )}
      </div>

      {/* Tracking Search */}
      <form onSubmit={handleTrack} className="tracking-search">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="tracking-input"
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinner" /> : 'Track'}
          </button>
        </div>
        {error && <span className="error-message">{error}</span>}
      </form>

      {orderTrackingNumber && (
        <div className="tracking-status-bar">
          <div className="status-item">
            <span className="status-label">Carrier</span>
            <span className="status-value">{trackingData?.carrier || 'N/A'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Status</span>
            <span 
              className="status-value"
              style={{ color: getStatusColor(trackingData?.status) }}
            >
              {trackingData ? getStatusLabel(trackingData.status) : 'Not Available'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Est. Delivery</span>
            <span className="status-value">
              {trackingData?.estimatedDelivery 
                ? formatDate(trackingData.estimatedDelivery, 'MMM DD, YYYY')
                : 'N/A'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Updated</span>
            <span className="status-value">
              {trackingData?.lastUpdated 
                ? formatDistanceToNow(new Date(trackingData.lastUpdated), { addSuffix: true })
                : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Tracking Events */}
      {trackingData && trackingData.events && (
        <div className="tracking-events">
          <h4>Tracking History</h4>
          <div className="events-list">
            {trackingData.events.map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-marker">
                  <div className="event-dot" />
                  {index < trackingData.events.length - 1 && (
                    <div className="event-line" />
                  )}
                </div>
                <div className="event-content">
                  <div className="event-header">
                    <span className="event-status">{event.status}</span>
                    <span className="event-date">
                      {formatDate(event.timestamp, 'MMM DD, YYYY HH:mm')}
                    </span>
                  </div>
                  <p className="event-location">
                    <FaMapMarkerAlt /> {event.location}
                  </p>
                  <p className="event-description">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          {trackingData?.currentLocation && (
            <div className="tracking-current-location">
              <FaMapMarkerAlt className="location-icon" />
              <span>Current Location: {trackingData.currentLocation}</span>
            </div>
          )}

          {trackingData?.trackingUrl && (
            <a 
              href={trackingData.trackingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tracking-link"
            >
              Track on Carrier Site <FaExternalLinkAlt />
            </a>
          )}
        </div>
      )}

      {!trackingData && !isLoading && orderTrackingNumber && (
        <div className="tracking-not-available">
          <FaBox className="not-available-icon" />
          <p>Tracking information is not available yet</p>
          <p className="subtext">Please check back later</p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;