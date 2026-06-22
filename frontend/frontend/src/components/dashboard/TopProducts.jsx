import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const TopProducts = ({ products, limit = 5 }) => {
  if (!products || products.length === 0) {
    return (
      <div className="top-products-empty">
        <p>No products found</p>
      </div>
    );
  }

  const sortedProducts = [...products]
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, limit);

  return (
    <div className="top-products">
      <div className="section-header">
        <h2>Top Products</h2>
        <Link to="/products" className="view-all">View All</Link>
      </div>
      <div className="products-list">
        {sortedProducts.map((product, index) => (
          <Link to={`/products/${product._id}`} key={product._id} className="product-item">
            <div className="product-rank">#{index + 1}</div>
            <div className="product-info">
              <div className="product-image">
                <img src={product.images?.[0]?.url || '/placeholder-product.jpg'} alt={product.name} />
              </div>
              <div className="product-details">
                <span className="product-name">{product.name}</span>
                <span className="product-category">{product.category}</span>
              </div>
            </div>
            <div className="product-stats">
              <span className="product-sales">{product.sales || 0} sold</span>
              <span className="product-revenue">{formatCurrency((product.sales || 0) * product.finalPrice)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;