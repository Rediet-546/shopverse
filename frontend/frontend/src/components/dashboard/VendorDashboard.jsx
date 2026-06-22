import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaStore, 
  FaBox, 
  FaShoppingBag, 
  FaDollarSign,
  FaUsers,
  FaPlus,
  FaChartLine,
  FaEye,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DashboardLayout from './DashboardLayout';
import DashboardStats from './DashboardStats';
import RecentOrders from './RecentOrders';
import ProductAnalytics from './ProductAnalytics';
import SalesOverview from './SalesOverview';
import TopProducts from './TopProducts';
import { fetchVendorOrders } from '../../redux/slices/orderSlice';
import { fetchVendorProducts } from '../../redux/slices/productSlice';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const VendorDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orders, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { products, isLoading: productsLoading } = useSelector((state) => state.products);

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    averageRating: 0,
    views: 0
  });

  useEffect(() => {
    dispatch(fetchVendorOrders());
    dispatch(fetchVendorProducts());
  }, [dispatch]);

  useEffect(() => {
    if (orders && products) {
      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter(order => order.status === 'delivered' || order.status === 'shipped')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      const totalProducts = products.length;
      const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
      const avgRating = products.length > 0 
        ? products.reduce((sum, p) => sum + (p.ratings?.average || 0), 0) / products.length 
        : 0;

      setStats({
        totalSales: orders.filter(o => o.status === 'delivered').length,
        totalOrders,
        totalProducts,
        totalRevenue,
        averageRating: avgRating,
        views: totalViews
      });
    }
  }, [orders, products]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: FaDollarSign,
      color: '#48bb78',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: FaBox,
      color: '#667eea',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: FaShoppingBag,
      color: '#f6ad55',
      trend: '+2',
      trendUp: true
    },
    {
      title: 'Rating',
      value: stats.averageRating.toFixed(1),
      icon: FaStar,
      color: '#ed64a6',
      trend: '★',
      trendUp: true
    }
  ];

  return (
    <DashboardLayout title="Vendor Dashboard" user={user} role="vendor">
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section vendor-welcome">
          <div className="welcome-text">
            <h1>Welcome back, {user?.firstName}!</h1>
            <p>Manage your store and track your sales performance.</p>
          </div>
          <div className="welcome-actions">
            <Link to="/vendor/products/new" className="btn btn-primary">
              <FaPlus /> Add New Product
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={statCards} />

        {/* Sales Overview */}
        <div className="dashboard-row">
          <div className="dashboard-col-7">
            <SalesOverview orders={orders} />
          </div>
          <div className="dashboard-col-5">
            <ProductAnalytics products={products} />
          </div>
        </div>

        {/* Top Products */}
        <div className="dashboard-row">
          <div className="dashboard-col-6">
            <TopProducts products={products} limit={5} />
          </div>
          <div className="dashboard-col-6">
            <div className="recent-orders-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <Link to="/vendor/orders" className="view-all">View All</Link>
              </div>
              <RecentOrders orders={orders?.slice(0, 5) || []} loading={ordersLoading} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats-grid">
          <div className="quick-stat-card">
            <FaEye className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Total Views</span>
              <span className="stat-value">{stats.views}</span>
            </div>
          </div>
          <div className="quick-stat-card">
            <FaUsers className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Customers</span>
              <span className="stat-value">--</span>
            </div>
          </div>
          <div className="quick-stat-card">
            <FaChartLine className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Conversion Rate</span>
              <span className="stat-value">2.4%</span>
            </div>
          </div>
          <div className="quick-stat-card">
            <FaStar className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Avg Rating</span>
              <span className="stat-value">{stats.averageRating.toFixed(1)} ★</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;