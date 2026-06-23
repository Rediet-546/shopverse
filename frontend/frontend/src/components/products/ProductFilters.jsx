import React from 'react';
import { FaTimes, FaFilter } from 'react-icons/fa';
import '../../styles/products.css';

const ProductFilters = ({ filters, onFilterChange, onClose }) => {
  const categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Beauty & Health',
    'Sports & Outdoors',
    'Toys & Games',
    'Food & Beverages',
    'Automotive',
    'Other'
  ];

  const handleClearFilters = () => {
    onFilterChange('category', '');
    onFilterChange('minPrice', '');
    onFilterChange('maxPrice', '');
    onFilterChange('status', '');
    onFilterChange('search', '');
  };

  return (
    <div className="product-filters">
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
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Price Range</label>
          <div className="price-range">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="filter-input"
              placeholder="Min"
              min="0"
            />
            <span className="price-separator">to</span>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="filter-input"
              placeholder="Max"
              min="0"
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Items per page</label>
          <select
            value={filters.limit}
            onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="96">96</option>
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

export default ProductFilters;