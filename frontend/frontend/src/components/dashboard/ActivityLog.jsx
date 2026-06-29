import React from 'react';
import { useSelector } from 'react-redux';
import {
  FaCheckCircle,
  FaClock,
  FaShoppingBag,
  FaShoppingCart,
  FaTruck,
  FaUserCircle
} from 'react-icons/fa';
import { formatDistanceToNow } from '../../utils/helpers';
import '../../styles/dashboard.css';

const getOrderActivity = (order) => {
  const status = order?.status || 'pending';
  const orderLabel = order?.orderNumber ? `#${order.orderNumber}` : 'your order';

  const activityByStatus = {
    delivered: {
      icon: FaCheckCircle,
      title: 'Order delivered',
      description: `Order ${orderLabel} was delivered successfully.`,
      color: '#38a169'
    },
    shipped: {
      icon: FaTruck,
      title: 'Order shipped',
      description: `Order ${orderLabel} is on its way.`,
      color: '#48bb78'
    },
    processing: {
      icon: FaClock,
      title: 'Order processing',
      description: `Order ${orderLabel} is being prepared.`,
      color: '#667eea'
    },
    confirmed: {
      icon: FaShoppingBag,
      title: 'Order confirmed',
      description: `Order ${orderLabel} has been confirmed.`,
      color: '#4299e1'
    },
    pending: {
      icon: FaClock,
      title: 'Order placed',
      description: `Order ${orderLabel} is pending confirmation.`,
      color: '#f6ad55'
    }
  };

  return activityByStatus[status] || activityByStatus.pending;
};

const ActivityLog = ({ limit = 5 }) => {
  const { user } = useSelector((state) => state.auth);
  const { orders = [] } = useSelector((state) => state.orders);
  const { items = [] } = useSelector((state) => state.cart);

  const orderActivities = orders.map((order) => {
    const activity = getOrderActivity(order);
    const createdAt = order.updatedAt || order.createdAt;

    return {
      id: order._id || order.orderNumber,
      createdAt,
      ...activity
    };
  });

  const cartActivity = items.length > 0 ? [{
    id: 'cart-active',
    icon: FaShoppingCart,
    title: 'Cart updated',
    description: `${items.length} item${items.length === 1 ? '' : 's'} waiting in your cart.`,
    color: '#f6ad55',
    createdAt: new Date().toISOString()
  }] : [];

  const profileActivity = user ? [{
    id: 'profile-ready',
    icon: FaUserCircle,
    title: 'Profile active',
    description: 'Your ShopVerse account is ready to use.',
    color: '#667eea',
    createdAt: user.updatedAt || user.createdAt || new Date().toISOString()
  }] : [];

  const activities = [...cartActivity, ...orderActivities, ...profileActivity]
    .filter((activity) => activity.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  if (activities.length === 0) {
    return (
      <div className="activity-log activity-log-empty">
        <FaClock />
        <p>No recent activity yet</p>
      </div>
    );
  }

  return (
    <div className="activity-log">
      {activities.map((activity) => {
        const ActivityIcon = activity.icon;

        return (
          <div className="activity-item" key={activity.id}>
            <div className="activity-icon" style={{ background: `${activity.color}20`, color: activity.color }}>
              <ActivityIcon />
            </div>
            <div className="activity-details">
              <div className="activity-title-row">
                <h3>{activity.title}</h3>
                <span>{formatDistanceToNow(activity.createdAt)}</span>
              </div>
              <p>{activity.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityLog;
