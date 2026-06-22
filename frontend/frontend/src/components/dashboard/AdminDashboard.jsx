import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaBox, 
  FaShoppingBag, 
  FaDollarSign,
  FaStore,
  FaChartLine,
  FaCog,
  FaUserPlus,
  FaPlus,
  FaDownload,
  FaEye,
  FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DashboardLayout from './DashboardLayout';
import DashboardStats from './DashboardStats';
import RecentOrders from './RecentOrders';
import UserManagement from './UserManagement';
import RevenueChart from './RevenueChart';
import TopProducts from './TopProducts';
import { fetchAllUsers } from '../../redux/slices/userSlice';
import { fetchOrders } from '../../redux/slices/orderSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, isLoading: usersLoading } = useSelector((state) => state.users);
  const { orders, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { products, isLoading: productsLoading } = useSelector((state) => state.products);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchOrders());
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (users && orders && products) {
      const totalUsers = users.length;
      const totalVendors = users.filter(u => u.role === 'vendor').length;
      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter(order => order.status === 'delivered' || order.status === 'shipped')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      const totalProducts = products.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      setStats({
        totalUsers,
        totalVendors,
        totalOrders,
        totalRevenue,
        totalProducts,
        pendingOrders
      });
    }
  }, [users, orders, products]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: FaDollarSign,
      color: '#48bb78',
      trend: '+22%',
      trendUp: true
    },
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: FaBox,
      color: '#667eea',
      trend: `${stats.pendingOrders} pending`,
      trendUp: stats.pendingOrders < 10
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: FaUsers,
      color: '#f6ad55',
      trend: `${stats.totalVendors} vendors`,
      trendUp: true
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: FaShoppingBag,
      color: '#ed64a6',
      trend: '+5 this week',
      trendUp: true
    }
  ];

  const quickActions = [
    { icon: FaUserPlus, label: 'Add User', link: '/admin/users/new', color: '#667eea' },
    { icon: FaPlus, label: 'Add Product', link: '/admin/products/new', color: '#48bb78' },
    { icon: FaStore, label: 'Manage Vendors', link: '/admin/vendors', color: '#f6ad55' },
    { icon: FaCog, label: 'Settings', link: '/admin/settings', color: '#a0aec0' }
  ];

  return (
    <DashboardLayout title="Admin Dashboard" user={user} role="admin">
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section admin-welcome">
          <div className="welcome-text">
            <h1>Welcome back, {user?.firstName}!</h1>
            <p>Manage your platform and monitor key metrics.</p>
          </div>
          <div className="welcome-actions">
            <button className="btn btn-outline">
              <FaDownload /> Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={statCards} />

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <Link to={action.link} key={index} className="quick-action-card">
                <div className="action-icon" style={{ background: action.color }}>
                  <action.icon />
                </div>
                <span className="action-label">{action.label}</span>
                <FaArrowRight className="action-arrow" />
              </Link>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="dashboard-row">
          <div className="dashboard-col-7">
            <RevenueChart orders={orders} />
          </div>
          <div className="dashboard-col-5">
            <TopProducts products={products} limit={5} />
          </div>
        </div>

        {/* Recent Orders & Users */}
        <div className="dashboard-row">
          <div className="dashboard-col-6">
            <div className="recent-orders-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <Link to="/admin/orders" className="view-all">View All</Link>
              </div>
              <RecentOrders orders={orders?.slice(0, 5) || []} loading={ordersLoading} />
            </div>
          </div>
          <div className="dashboard-col-6">
            <UserManagement users={users?.slice(0, 5) || []} loading={usersLoading} simple />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;