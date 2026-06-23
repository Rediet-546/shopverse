import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaDownload,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchOrders, updateOrderStatus, cancelOrder } from '../../redux/slices/orderSlice';
import OrderCard from './OrderCard';
import OrderFilters from './OrderFilters';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/orders.css';

const OrdersList = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, error, total, pages } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isBulkAction, setIsBulkAction] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders(filters));
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
    dispatch(fetchOrders(filters));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedOrders.length} orders?`)) {
      return;
    }

    try {
      setIsBulkAction(true);
      await Promise.all(
        selectedOrders.map(orderId =>
          action === 'cancel' 
            ? dispatch(cancelOrder(orderId)).unwrap()
            : dispatch(updateOrderStatus({ orderId, status: action })).unwrap()
        )
      );
      toast.success(`${selectedOrders.length} orders updated successfully`);
      setSelectedOrders([]);
      dispatch(fetchOrders(filters));
    } catch (error) {
      toast.error(error || 'Bulk action failed');
    } finally {
      setIsBulkAction(false);
    }
  };

  const handleExport = () => {
    // In a real app, this would generate a CSV/Excel file
    toast.success('Export started. Download will begin shortly.');
  };

  if (isLoading && !orders.length) {
    return <Loader fullPage text="Loading orders..." />;
  }

  return (
    <div className="orders-page">
      <div className="orders-page-header">
        <div className="header-left">
          <h1>My Orders</h1>
          <span className="order-count">{total} orders</span>
        </div>
        <div className="header-right">
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

      {/* Search Bar */}
      <div className="orders-search">
        <form onSubmit={handleSearch} className="search-form">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number, product, or customer..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <OrderFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedOrders.length} orders selected</span>
          <div className="bulk-actions-buttons">
            <button 
              className="btn btn-sm btn-success"
              onClick={() => handleBulkAction('confirmed')}
              disabled={isBulkAction}
            >
              Confirm
            </button>
            <button 
              className="btn btn-sm btn-danger"
              onClick={() => handleBulkAction('cancel')}
              disabled={isBulkAction}
            >
              Cancel
            </button>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedOrders([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="no-orders">
          <FaBox className="no-orders-icon" />
          <h3>No orders found</h3>
          <p>Try adjusting your filters or search criteria</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Sort Header */}
          <div className="orders-sort-header">
            <div className="sort-options">
              <button 
                className={`sort-btn ${filters.sortBy === 'createdAt' ? 'active' : ''}`}
                onClick={() => handleSort('createdAt')}
              >
                Date
                {filters.sortBy === 'createdAt' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
              <button 
                className={`sort-btn ${filters.sortBy === 'totalAmount' ? 'active' : ''}`}
                onClick={() => handleSort('totalAmount')}
              >
                Amount
                {filters.sortBy === 'totalAmount' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
              <button 
                className={`sort-btn ${filters.sortBy === 'status' ? 'active' : ''}`}
                onClick={() => handleSort('status')}
              >
                Status
                {filters.sortBy === 'status' && (
                  filters.sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                )}
              </button>
            </div>
            <span className="results-count">Showing {orders.length} of {total} orders</span>
          </div>

          {/* Order Cards */}
          <div className="orders-grid">
            {orders.map((order) => (
              <OrderCard 
                key={order._id}
                order={order}
                isSelected={selectedOrders.includes(order._id)}
                onSelect={handleSelectOrder}
                showSelect={selectedOrders.length > 0}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <Pagination
              currentPage={filters.page}
              totalPages={pages}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default OrdersList;