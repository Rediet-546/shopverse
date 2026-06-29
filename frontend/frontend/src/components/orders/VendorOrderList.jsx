import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
// Replace with:
import { FaBox, FaSearch, FaFilter, FaEye, FaCheck, FaTimes, FaTruck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchVendorOrders, updateOrderStatus } from '../../redux/slices/orderSlice';
import OrderStatusBadge from './OrderStatusBadge';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const VendorOrderList = () => {
  const dispatch = useDispatch();
  const { vendorOrders, isLoading, total, pages } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVendorOrders(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    dispatch(fetchVendorOrders(filters));
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setIsSubmitting(true);
      await dispatch(updateOrderStatus({ orderId, status })).unwrap();
      toast.success(`Order status updated to ${status}`);
      setShowStatusModal(false);
      setSelectedOrder(null);
      dispatch(fetchVendorOrders(filters));
    } catch (error) {
      toast.error(error || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    toast.success('Export started. Download will begin shortly.');
  };

  const handleRefresh = () => {
    dispatch(fetchVendorOrders(filters));
    toast.success('Orders refreshed');
  };

  const getAvailableActions = (order) => {
    const actions = [];
    const status = order.status;

    if (status === 'pending') {
      actions.push({ label: 'Confirm', value: 'confirmed', icon: <FaCheck />, color: '#48bb78' });
    }
    if (status === 'confirmed') {
      actions.push({ label: 'Start Processing', value: 'processing', icon: <FaPackage />, color: '#667eea' });
    }
    if (status === 'processing') {
      actions.push({ label: 'Mark as Shipped', value: 'shipped', icon: <FaTruck />, color: '#4299e1' });
    }
    if (status === 'shipped') {
      actions.push({ label: 'Mark as Delivered', value: 'delivered', icon: <FaCheckCircle />, color: '#38a169' });
    }
    if (status === 'pending' || status === 'confirmed') {
      actions.push({ label: 'Cancel', value: 'cancelled', icon: <FaTimes />, color: '#fc8181' });
    }

    return actions;
  };

  if (isLoading && !vendorOrders) {
    return <Loader fullPage text="Loading orders..." />;
  }

  const orderStats = {
    total: vendorOrders?.length || 0,
    pending: vendorOrders?.filter(o => o.status === 'pending').length || 0,
    processing: vendorOrders?.filter(o => o.status === 'processing').length || 0,
    shipped: vendorOrders?.filter(o => o.status === 'shipped').length || 0,
    delivered: vendorOrders?.filter(o => o.status === 'delivered').length || 0,
    cancelled: vendorOrders?.filter(o => o.status === 'cancelled').length || 0
  };

  return (
    <div className="vendor-orders-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Store Orders</h1>
          <span className="order-count">{total} total orders</span>
        </div>
        <div className="header-right">
          <button className="btn btn-outline" onClick={handleRefresh}>
            <FaSyncAlt /> Refresh
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <FaDownload /> Export
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="order-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{orderStats.total}</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{orderStats.pending}</span>
        </div>
        <div className="stat-card processing">
          <span className="stat-label">Processing</span>
          <span className="stat-value">{orderStats.processing}</span>
        </div>
        <div className="stat-card shipped">
          <span className="stat-label">Shipped</span>
          <span className="stat-value">{orderStats.shipped}</span>
        </div>
        <div className="stat-card delivered">
          <span className="stat-label">Delivered</span>
          <span className="stat-value">{orderStats.delivered}</span>
        </div>
        <div className="stat-card cancelled">
          <span className="stat-label">Cancelled</span>
          <span className="stat-value">{orderStats.cancelled}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="orders-search">
        <form onSubmit={handleSearch} className="search-form">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="order-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
                <span>to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="filter-select"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="filter-actions">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setFilters({
                    status: '',
                    search: '',
                    startDate: '',
                    endDate: '',
                    page: 1,
                    limit: 20
                  });
                }}
              >
                Clear All
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-wrapper">
        {vendorOrders && vendorOrders.length > 0 ? (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-id">#{order.orderNumber}</td>
                    <td className="customer-name">
                      {order.userId?.firstName} {order.userId?.lastName}
                    </td>
                    <td>{formatDate(order.createdAt, 'MMM DD, YYYY')}</td>
                    <td>{order.items?.length || 0}</td>
                    <td className="order-total">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} size="small" />
                    </td>
                    <td className="order-actions">
                      <Link to={`/vendor/orders/${order._id}`} className="action-btn" title="View Details">
                        <FaEye />
                      </Link>
                      {getAvailableActions(order).map((action, idx) => (
                        <button
                          key={idx}
                          className="action-btn status-action"
                          style={{ color: action.color }}
                          onClick={() => {
                            setSelectedOrder(order);
                            setStatusAction(action.value);
                            setShowStatusModal(true);
                          }}
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <Pagination
                currentPage={filters.page}
                totalPages={pages}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            )}
          </>
        ) : (
          <div className="no-orders">
            <FaBox className="no-orders-icon" />
            <h3>No orders found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Are you sure you want to mark order #{selectedOrder.orderNumber} as{' '}
                <strong>{statusAction.toUpperCase()}</strong>?
              </p>
              <div className="modal-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowStatusModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStatusUpdate(selectedOrder._id, statusAction)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : `Confirm ${statusAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrderList;
