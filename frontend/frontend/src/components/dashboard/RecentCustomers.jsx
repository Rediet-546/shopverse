import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaShoppingBag,
  FaDollarSign,
  FaArrowRight,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const RecentCustomers = ({ 
  customers = [], 
  orders = [],
  limit = 5,
  showAll = false,
  className = '' 
}) => {
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customers && customers.length > 0) {
      // Calculate customer stats
      const customersWithStats = customers.map(customer => {
        const customerOrders = orders.filter(o => o.userId === customer._id);
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders
          .filter(o => o.status === 'delivered' || o.status === 'shipped')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const lastOrder = customerOrders.length > 0 
          ? customerOrders.reduce((latest, o) => 
              new Date(o.createdAt) > new Date(latest.createdAt) ? o : latest
            )
          : null;

        return {
          ...customer,
          totalOrders,
          totalSpent,
          lastOrder,
          orderCount: totalOrders,
          joinedDate: customer.createdAt
        };
      });

      // Sort by last order date
      const sorted = customersWithStats
        .sort((a, b) => {
          if (!a.lastOrder) return 1;
          if (!b.lastOrder) return -1;
          return new Date(b.lastOrder.createdAt) - new Date(a.lastOrder.createdAt);
        })
        .slice(0, limit);

      setRecentCustomers(sorted);
      setFilteredCustomers(sorted);
    }
  }, [customers, orders, limit]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = recentCustomers.filter(customer =>
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(recentCustomers);
    }
  }, [searchTerm, recentCustomers]);

  if (isLoading) {
    return (
      <div className="recent-customers-loading">
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
        <div className="skeleton-row"></div>
      </div>
    );
  }

  if (recentCustomers.length === 0) {
    return (
      <div className="recent-customers-empty">
        <div className="empty-icon">
          <FaUser />
        </div>
        <p>No customers yet</p>
        <p className="empty-subtext">Start selling to see your customers here</p>
      </div>
    );
  }

  return (
    <div className={`recent-customers ${className}`}>
      <div className="section-header">
        <h2>Recent Customers</h2>
        <div className="section-actions">
          <div className="search-wrapper small">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {showAll && (
            <Link to="/admin/users" className="view-all">
              View All
            </Link>
          )}
        </div>
      </div>

      <div className="customers-list">
        {filteredCustomers.map((customer) => (
          <Link 
            to={`/admin/users/${customer._id}`} 
            key={customer._id} 
            className="customer-item"
          >
            <div className="customer-avatar">
              {customer.profileImage ? (
                <img src={customer.profileImage} alt={customer.firstName} />
              ) : (
                <div className="avatar-placeholder">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </div>
              )}
              <span className={`customer-status ${customer.isActive ? 'active' : 'inactive'}`}></span>
            </div>

            <div className="customer-info">
              <div className="customer-name">
                {customer.firstName} {customer.lastName}
                <span className="customer-role">{customer.role}</span>
              </div>
              <div className="customer-details">
                <span className="detail-item">
                  <FaEnvelope /> {customer.email}
                </span>
                {customer.phone && (
                  <span className="detail-item">
                    <FaMapMarkerAlt /> {customer.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="customer-stats">
              <div className="stat-item">
                <FaShoppingBag />
                <span>{customer.totalOrders} orders</span>
              </div>
              <div className="stat-item">
                <FaDollarSign />
                <span>{formatCurrency(customer.totalSpent)}</span>
              </div>
              {customer.lastOrder && (
                <div className="stat-item">
                  <FaCalendarAlt />
                  <span>{formatDistanceToNow(new Date(customer.lastOrder.createdAt), { addSuffix: true })}</span>
                </div>
              )}
            </div>

            <div className="customer-action">
              <FaArrowRight />
            </div>
          </Link>
        ))}
      </div>

      {showAll && filteredCustomers.length >= limit && (
        <div className="customers-footer">
          <Link to="/admin/users" className="view-more">
            View All Customers <FaArrowRight />
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentCustomers;