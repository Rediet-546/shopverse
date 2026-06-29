import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaBox, 
  FaHeart, 
  FaCog,
  FaShoppingBag,
  FaWallet,
  FaTrendUp,
  FaClock,
  FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fetchOrders } from '../../redux/slices/orderSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import DashboardLayout from './DashboardLayout';
import DashboardStats from './DashboardStats';
import RecentOrders from './RecentOrders';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

const UserDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orders, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { items, total } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist || { wishlist: [] });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    cartItems: 0
  });

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (orders) {
      const totalOrders = orders.length;
      const totalSpent = orders
        .filter(order => order.status === 'delivered' || order.status === 'shipped')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      setStats({
        totalOrders,
        totalSpent,
        wishlistCount: wishlist.length,
        cartItems: items?.length || 0
      });
    }
  }, [orders, wishlist, items]);

  const quickActions = [
    { icon: FaShoppingBag, label: 'Shop Now', link: '/products', color: '#667eea' },
    { icon: FaBox, label: 'My Orders', link: '/orders', color: '#48bb78' },
    { icon: FaHeart, label: 'Wishlist', link: '/wishlist', color: '#ed64a6' },
    { icon: FaCog, label: 'Settings', link: '/settings', color: '#a0aec0' }
  ];

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: FaBox,
      color: '#667eea',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      icon: FaWallet,
      color: '#48bb78',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Wishlist',
      value: stats.wishlistCount,
      icon: FaHeart,
      color: '#ed64a6',
      trend: '+3',
      trendUp: true
    },
    {
      title: 'Cart Items',
      value: stats.cartItems,
      icon: FaShoppingBag,
      color: '#f6ad55',
      trend: stats.cartItems > 0 ? 'Active' : 'Empty',
      trendUp: stats.cartItems > 0
    }
  ];

  return (
    <DashboardLayout title="Dashboard" user={user}>
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back, {user?.firstName}!</h1>
            <p>Here's what's happening with your account today.</p>
          </div>
          <div className="welcome-date">
            <FaClock />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
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

        {/* Recent Orders */}
        <div className="recent-orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/orders" className="view-all">View All</Link>
          </div>
          <RecentOrders orders={orders?.slice(0, 5) || []} loading={ordersLoading} />
        </div>

        {/* Activity Log */}
        <div className="activity-section">
          <h2>Recent Activity</h2>
          <ActivityLog limit={5} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;