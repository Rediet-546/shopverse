import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaEye } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const RecentOrders = ({ orders, loading = false }) => {
  if (loading) {
    return (
      <div className="recent-orders-loading">
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="recent-orders-empty">
        <p>No orders yet</p>
        <Link to="/products" className="btn btn-primary btn-small">
          Start Shopping
        </Link>
      </div>
    );
  }

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
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="recent-orders">
      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="order-id">#{order.orderNumber}</td>
                <td>{format(new Date(order.createdAt), 'MMM d, yyyy')}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td>
                  <Link to={`/orders/${order._id}`} className="view-order-btn">
                    <FaEye />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;