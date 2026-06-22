import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUser, 
  FaBox, 
  FaHeart, 
  FaCog,
  FaStore,
  FaUsers,
  FaChartBar,
  FaShoppingBag,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaSearch
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import '../../styles/dashboard.css';

const DashboardLayout = ({ children, title, user, role = 'user' }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Navigation items based on role
  const getNavItems = () => {
    const commonItems = [
      { icon: FaHome, label: 'Dashboard', path: '/dashboard' },
      { icon: FaUser, label: 'Profile', path: '/profile' },
      { icon: FaBox, label: 'Orders', path: '/orders' },
      { icon: FaHeart, label: 'Wishlist', path: '/wishlist' },
      { icon: FaCog, label: 'Settings', path: '/settings' }
    ];

    const vendorItems = [
      { icon: FaStore, label: 'Store', path: '/vendor/store' },
      { icon: FaShoppingBag, label: 'Products', path: '/vendor/products' },
      { icon: FaBox, label: 'Orders', path: '/vendor/orders' },
      { icon: FaChartBar, label: 'Analytics', path: '/vendor/analytics' }
    ];

    const adminItems = [
      { icon: FaUsers, label: 'Users', path: '/admin/users' },
      { icon: FaStore, label: 'Vendors', path: '/admin/vendors' },
      { icon: FaShoppingBag, label: 'Products', path: '/admin/products' },
      { icon: FaBox, label: 'Orders', path: '/admin/orders' },
      { icon: FaChartBar, label: 'Analytics', path: '/admin/analytics' }
    ];

    let items = [...commonItems];
    if (role === 'vendor') {
      items = [...items, ...vendorItems];
    } else if (role === 'admin') {
      items = [...items, ...adminItems];
    }

    return items;
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Toggle (Mobile) */}
      <button 
        className="sidebar-toggle mobile-toggle"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        <FaBars />
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="brand-icon">🛒</span>
            <span className="brand-text">ShopVerse</span>
          </Link>
          <button 
            className="sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1 className="page-title">{title}</h1>
          </div>
          <div className="header-right">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Search..." className="search-input" />
            </div>
            <button className="notification-btn">
              <FaBell />
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.firstName} />
              ) : (
                <div className="user-avatar">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <span className="user-name">{user?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-body">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;