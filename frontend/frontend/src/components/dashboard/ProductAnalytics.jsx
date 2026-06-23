import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEye, 
  FaShoppingCart, 
  FaStar, 
  FaArrowUp, 
  FaArrowDown,
  FaBox,
  FaDollarSign,
  FaChartLine,
  FaTag,
  FaPlus,
  FaDownload
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';
import DashboardChart from './DashboardChart';
import '../../styles/dashboard.css';

const ProductAnalytics = ({ 
  products = [], 
  orders = [], 
  limit = 5,
  showAll = false,
  className = '' 
}) => {
  const [topProducts, setTopProducts] = useState([]);
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averagePrice: 0,
    topCategory: ''
  });
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (products && products.length > 0) {
      // Calculate product stats
      const totalProducts = products.length;
      const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
      const totalRevenue = products.reduce((sum, p) => sum + ((p.sales || 0) * p.finalPrice), 0);
      const averagePrice = totalProducts > 0 
        ? products.reduce((sum, p) => sum + p.finalPrice, 0) / totalProducts 
        : 0;

      // Find top category
      const categoryCount = {};
      products.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      });
      const topCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      setProductStats({
        totalProducts,
        totalSales,
        totalRevenue,
        averagePrice,
        topCategory
      });

      // Get top products by sales
      const sorted = [...products]
        .filter(p => p.sales > 0)
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, limit);

      setTopProducts(sorted);

      // Category data for chart
      const categories = Object.keys(categoryCount);
      const counts = categories.map(c => categoryCount[c]);
      
      setCategoryData({
        labels: categories,
        datasets: [
          {
            label: 'Products by Category',
            data: counts,
            backgroundColor: [
              '#667eea', '#48bb78', '#f6ad55', '#ed64a6', 
              '#4299e1', '#9f7aea', '#f56565', '#38b2ac',
              '#ed8936', '#a0aec0'
            ],
            borderColor: 'white',
            borderWidth: 2
          }
        ]
      });
    }
  }, [products, limit]);

  const getTrend = (value) => {
    // Mock trend calculation
    return {
      direction: value > 0 ? 'up' : 'down',
      value: value > 0 ? '+12%' : '-8%'
    };
  };

  const statCards = [
    {
      title: 'Total Products',
      value: productStats.totalProducts,
      icon: FaBox,
      color: '#667eea',
      trend: getTrend(productStats.totalProducts)
    },
    {
      title: 'Total Sales',
      value: productStats.totalSales,
      icon: FaShoppingCart,
      color: '#48bb78',
      trend: getTrend(productStats.totalSales)
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(productStats.totalRevenue),
      icon: FaDollarSign,
      color: '#f6ad55',
      trend: getTrend(productStats.totalRevenue)
    },
    {
      title: 'Top Category',
      value: productStats.topCategory || 'N/A',
      icon: FaTag,
      color: '#ed64a6'
    }
  ];

  return (
    <div className={`product-analytics ${className}`}>
      <div className="section-header">
        <h2>Product Analytics</h2>
        <div className="section-actions">
          {showAll && (
            <Link to="/vendor/products" className="view-all">
              View All Products
            </Link>
          )}
          <Link to="/vendor/products/new" className="btn btn-primary btn-small">
            <FaPlus /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="product-stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card mini">
            <div className="stat-icon-wrapper" style={{ background: stat.color + '20' }}>
              <stat.icon style={{ color: stat.color }} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.title}</span>
              <span className="stat-value">{stat.value}</span>
              {stat.trend && (
                <div className={`stat-trend ${stat.trend.direction}`}>
                  {stat.trend.direction === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                  <span>{stat.trend.value}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Category Chart */}
      {categoryData.labels && categoryData.labels.length > 0 && (
        <div className="category-chart-container">
          <h4>Products by Category</h4>
          <DashboardChart 
            type="doughnut" 
            data={categoryData}
            height={250}
          />
        </div>
      )}

      {/* Top Products List */}
      <div className="top-products-list">
        <h4>Top Selling Products</h4>
        {topProducts.length > 0 ? (
          <div className="products-list">
            {topProducts.map((product, index) => (
              <Link 
                to={`/vendor/products/${product._id}`} 
                key={product._id} 
                className="product-item"
              >
                <div className="product-rank">#{index + 1}</div>
                <div className="product-info">
                  <div className="product-image">
                    <img 
                      src={product.images?.[0]?.url || '/placeholder-product.jpg'} 
                      alt={product.name} 
                    />
                  </div>
                  <div className="product-details">
                    <span className="product-name">{product.name}</span>
                    <span className="product-category">{product.category}</span>
                  </div>
                </div>
                <div className="product-stats">
                  <span className="product-sales">
                    <FaShoppingCart /> {product.sales || 0} sold
                  </span>
                  <span className="product-revenue">
                    {formatCurrency((product.sales || 0) * product.finalPrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <p>No products sold yet</p>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="analytics-tips">
        <div className="tip-card">
          <FaChartLine className="tip-icon" />
          <div className="tip-content">
            <h5>Performance Insight</h5>
            <p>
              {productStats.totalSales > 0 
                ? `Your top product has sold ${topProducts[0]?.sales || 0} units. Consider restocking!` 
                : 'Start selling by adding more products to your store.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;