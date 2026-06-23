import React from 'react';
import { FaTimes, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import '../../styles/orders.css';

const OrderFilters = ({ filters, onFilterChange, onClose }) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const handleClearFilters = () => {
    onFilterChange('status', '');
    onFilterChange('startDate', '');
    onFilterChange('endDate', '');
    onFilterChange('search', '');
  };

  return (
    <div className="order-filters">
      <div className="filters-header">
        <h3>
          <FaFilter /> Filters
        </h3>
        <button className="close-filters" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="filter-input"
              placeholder="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="filter-input"
              placeholder="End Date"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Min Amount</label>
          <input
            type="number"
            value={filters.minAmount || ''}
            onChange={(e) => onFilterChange('minAmount', e.target.value)}
            className="filter-input"
            placeholder="Min"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label>Max Amount</label>
          <input
            type="number"
            value={filters.maxAmount || ''}
            onChange={(e) => onFilterChange('maxAmount', e.target.value)}
            className="filter-input"
            placeholder="Max"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label>Items per page</label>
          <select
            value={filters.limit}
            onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="filters-actions">
        <button className="btn btn-outline" onClick={handleClearFilters}>
          Clear All
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;