import React from 'react';
import { 
  FaCheck, 
  FaClock, 
  FaBox, 
  FaTruck, 
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaShoppingBag
} from 'react-icons/fa';
import { formatDate, formatDistanceToNow } from '../../utils/helpers';
import '../../styles/orders.css';

const OrderTimeline = ({ order }) => {
  if (!order) return null;

  const { status, createdAt, updatedAt, shipping } = order;

  // Build timeline events based on order status
  const getTimelineEvents = () => {
    const events = [
      {
        status: 'Order Placed',
        date: createdAt,
        icon: <FaShoppingBag />,
        description: 'Your order has been placed successfully'
      }
    ];

    if (status === 'confirmed' || status === 'processing' || status === 'shipped' || status === 'delivered') {
      events.push({
        status: 'Order Confirmed',
        date: order.confirmedAt || updatedAt,
        icon: <FaCheck />,
        description: 'Your order has been confirmed'
      });
    }

    if (status === 'processing' || status === 'shipped' || status === 'delivered') {
      events.push({
        status: 'Processing',
        date: order.processingAt || updatedAt,
        icon: <FaSpinner />,
        description: 'Your order is being processed'
      });
    }

    if (status === 'shipped' || status === 'delivered') {
      events.push({
        status: 'Shipped',
        date: shipping?.shippedDate || updatedAt,
        icon: <FaTruck />,
        description: `Your order has been shipped${shipping?.trackingNumber ? ` with tracking #${shipping.trackingNumber}` : ''}`
      });
    }

    if (status === 'delivered') {
      events.push({
        status: 'Delivered',
        date: shipping?.deliveredDate || updatedAt,
        icon: <FaCheckCircle />,
        description: 'Your order has been delivered'
      });
    }

    if (status === 'cancelled') {
      events.push({
        status: 'Cancelled',
        date: order.cancelledAt || updatedAt,
        icon: <FaTimes />,
        description: order.cancellationReason || 'Your order has been cancelled'
      });
    }

    return events;
  };

  const events = getTimelineEvents();
  const currentIndex = events.length - 1;

  const getEventStatus = (index) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusColor = (eventStatus) => {
    switch (eventStatus) {
      case 'completed': return '#48bb78';
      case 'current': return '#667eea';
      default: return '#e2e8f0';
    }
  };

  return (
    <div className="order-timeline">
      <h3 className="timeline-title">Order Timeline</h3>
      
      <div className="timeline">
        {events.map((event, index) => {
          const eventStatus = getEventStatus(index);
          const isLast = index === events.length - 1;
          
          return (
            <div key={index} className={`timeline-item ${eventStatus}`}>
              <div className="timeline-marker" style={{ borderColor: getStatusColor(eventStatus) }}>
                <div className="marker-icon" style={{ background: getStatusColor(eventStatus) }}>
                  {event.icon}
                </div>
                {!isLast && (
                  <div 
                    className="timeline-line" 
                    style={{ background: getStatusColor(eventStatus) }}
                  />
                )}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="event-status">{event.status}</span>
                  <span className="event-date">
                    {formatDate(event.date, 'MMM DD, YYYY HH:mm')}
                  </span>
                </div>
                <p className="event-description">{event.description}</p>
                <span className="event-time-ago">
                  {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {status === 'pending' && (
        <div className="timeline-waiting">
          <FaClock className="waiting-icon" />
          <p>Waiting for order confirmation</p>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;