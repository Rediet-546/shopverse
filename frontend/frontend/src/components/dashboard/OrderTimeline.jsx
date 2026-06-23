import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  FaClock, 
  FaCheck, 
  FaPackage, 
  FaShippingFast, 
  FaTruck,
  FaBox,
  FaTimes,
  FaArrowRight,
  FaSpinner,
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const OrderTimeline = ({ 
  orders = [], 
  limit = 10,
  showAll = false,
  className = '' 
}) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (orders && orders.length > 0) {
      const events = [];
      
      orders.forEach(order => {
        // Order created event
        events.push({
          id: `${order._id}-created`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          type: 'created',
          status: order.status,
          date: new Date(order.createdAt),
          total: order.totalAmount,
          items: order.items?.length || 0,
          description: `Order #${order.orderNumber} was placed`
        });

        // Status updates
        if (order.statusUpdates) {
          order.statusUpdates.forEach(update => {
            events.push({
              id: `${order._id}-${update.status}`,
              orderId: order._id,
              orderNumber: order.orderNumber,
              type: 'status',
              status: update.status,
              date: new Date(update.date),
              description: update.description || `Order status changed to ${update.status}`
            });
          });
        }

        // Shipping update
        if (order.status === 'shipped' || order.status === 'delivered') {
          events.push({
            id: `${order._id}-shipped`,
            orderId: order._id,
            orderNumber: order.orderNumber,
            type: 'shipping',
            status: order.status,
            date: new Date(order.shipping?.shippedDate || order.updatedAt),
            trackingNumber: order.shipping?.trackingNumber,
            carrier: order.shipping?.carrier,
            description: order.status === 'delivered' 
              ? `Order #${order.orderNumber} was delivered` 
              : `Order #${order.orderNumber} has been shipped`
          });
        }
      });

      // Sort by date descending
      events.sort((a, b) => b.date - a.date);
      setTimelineEvents(events.slice(0, limit));
    }
  }, [orders, limit]);

  const getStatusIcon = (type, status) => {
    if (type === 'created') {
      return <FaClock className="event-icon created" />;
    }
    
    switch (status) {
      case 'pending':
        return <FaHourglassHalf className="event-icon pending" />;
      case 'confirmed':
        return <FaCheck className="event-icon confirmed" />;
      case 'processing':
        return <FaSpinner className="event-icon processing" spin />;
      case 'shipped':
        return <FaShippingFast className="event-icon shipped" />;
      case 'delivered':
        return <FaCheckCircle className="event-icon delivered" />;
      case 'cancelled':
        return <FaTimes className="event-icon cancelled" />;
      default:
        return <FaBox className="event-icon default" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f6ad55',
      confirmed: '#4299e1',
      processing: '#667eea',
      shipped: '#48bb78',
      delivered: '#38a169',
      cancelled: '#fc8181',
      refunded: '#a0aec0'
    };
    return colors[status] || '#a0aec0';
  };

  const getStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  const getTimeAgo = (date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="order-timeline-loading">
        <div className="spinner"></div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="order-timeline-empty">
        <div className="empty-icon">
          <FaBox />
        </div>
        <p>No orders yet</p>
        <Link to="/products" className="btn btn-primary btn-small">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={`order-timeline ${className}`}>
      <div className="section-header">
        <h2>Recent Activity</h2>
        {showAll && (
          <Link to="/orders" className="view-all">
            View All Orders
          </Link>
        )}
      </div>

      <div className="timeline-container">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="timeline-item">
            {index < timelineEvents.length - 1 && (
              <div className="timeline-line"></div>
            )}
            
            <div className="timeline-dot" style={{ background: getStatusColor(event.status) }}>
              {getStatusIcon(event.type, event.status)}
            </div>

            <div className="timeline-content">
              <Link to={`/orders/${event.orderId}`} className="timeline-header">
                <div className="timeline-title">
                  <span className="timeline-order">Order #{event.orderNumber}</span>
                  <span 
                    className="timeline-status"
                    style={{ 
                      background: getStatusColor(event.status) + '20',
                      color: getStatusColor(event.status)
                    }}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                </div>
                <div className="timeline-time">
                  {getTimeAgo(event.date)}
                </div>
              </Link>

              <p className="timeline-description">{event.description}</p>

              {event.type === 'shipping' && event.trackingNumber && (
                <div className="timeline-tracking">
                  <span className="tracking-label">
                    <FaTruck /> Tracking:
                  </span>
                  <span className="tracking-number">{event.trackingNumber}</span>
                  {event.carrier && (
                    <span className="tracking-carrier">({event.carrier})</span>
                  )}
                </div>
              )}

              {event.type === 'created' && (
                <div className="timeline-details">
                  <span className="detail-item">
                    {event.items} item{event.items > 1 ? 's' : ''}
                  </span>
                  <span className="detail-divider">•</span>
                  <span className="detail-item">
                    Total: {formatCurrency(event.total)}
                  </span>
                </div>
              )}

              {event.type === 'status' && (
                <div className="timeline-details">
                  <span className="detail-item">
                    Status updated to {getStatusLabel(event.status)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAll && timelineEvents.length >= limit && (
        <div className="timeline-footer">
          <Link to="/orders" className="view-more">
            View All Orders <FaArrowRight />
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;