import React from 'react';
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
  FaSearch,
  FaTachometerAlt,
  FaFileInvoice,
  FaTag,
  FaShippingFast,
  FaStar,
  FaComments,
  FaCalendarAlt,
  FaWallet,
  FaClipboardList,
  FaTools,
  FaLifeRing
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import '../../styles/dashboard.css';

const DashboardSidebar = ({ 
  isOpen, 
  onClose, 
  user, 
  role = 'user',
  collapsed = false,
  onToggleCollapse 
}) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = async () => {
    await dispatch(logout());
  };

  // Navigation items based on role
  const getNavItems = () => {
    const commonItems = [
      { icon: FaHome, label: 'Dashboard', path: '/dashboard' },
      { icon: FaUser, label: 'Profile', path: '/profile' },
      { icon: FaBox, label: 'Orders', path: '/orders' },
      { icon: FaHeart, label: 'Wishlist', path: '/wishlist' },
      { icon: FaWallet, label: 'Wallet', path: '/wallet' },
      { icon: FaComments, label: 'Reviews', path: '/reviews' },
      { icon: FaCog, label: 'Settings', path: '/settings' }
    ];

    const vendorItems = [
      { icon: FaStore, label: 'Store', path: '/vendor/store' },
      { icon: FaShoppingBag, label: 'Products', path: '/vendor/products' },
      { icon: FaBox, label: 'Orders', path: '/vendor/orders' },
      { icon: FaChartBar, label: 'Analytics', path: '/vendor/analytics' },
      { icon: FaShippingFast, label: 'Shipping', path: '/vendor/shipping' },
      { icon: FaTag, label: 'Discounts', path: '/vendor/discounts' },
      { icon: FaStar, label: 'Reviews', path: '/vendor/reviews' }
    ];

    const adminItems = [
      { icon: FaTachometerAlt, label: 'Overview', path: '/admin/overview' },
      { icon: FaUsers, label: 'Users', path: '/admin/users' },
      { icon: FaStore, label: 'Vendors', path: '/admin/vendors' },
      { icon: FaShoppingBag, label: 'Products', path: '/admin/products' },
      { icon: FaBox, label: 'Orders', path: '/admin/orders' },
      { icon: FaChartBar, label: 'Analytics', path: '/admin/analytics' },
      { icon: FaFileInvoice, label: 'Reports', path: '/admin/reports' },
      { icon: FaCalendarAlt, label: 'Calendar', path: '/admin/calendar' },
      { icon: FaTools, label: 'System', path: '/admin/system' }
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
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Group items for better organization
  const groupedItems = {
    main: navItems.slice(0, 1),
    shop: navItems.slice(1, 4),
    account: navItems.slice(4, 7),
    ...(role === 'vendor' ? { vendor: navItems.slice(7, 13) } : {}),
    ...(role === 'admin' ? { admin: navItems.slice(7) } : {})
  };

  const getGroupLabel = (key) => {
    const labels = {
      main: 'Main',
      shop: 'Shopping',
      account: 'Account',
      vendor: 'Store Management',
      admin: 'Administration'
    };
    return labels[key] || key;
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="brand-icon">🛒</span>
            {!collapsed && <span className="brand-text">ShopVerse</span>}
          </Link>
          <button className="sidebar-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar-wrapper">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.firstName} />
              ) : (
                <div className="user-avatar">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <span className="user-status online"></span>
            </div>
            <div className="user-info">
              <span className="user-name-display">
                {user?.firstName} {user?.lastName}
              </span>
              <span className={`user-role ${user?.role}`}>
                {user?.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {Object.entries(groupedItems).map(([groupKey, items]) => {
            if (!items || items.length === 0) return null;
            
            return (
              <div key={groupKey} className="nav-group">
                {!collapsed && (
                  <div className="nav-group-label">{getGroupLabel(groupKey)}</div>
                )}
                {items.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <item.icon className="nav-icon" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                    {isActive(item.path) && !collapsed && (
                      <span className="nav-indicator"></span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-support">
              <FaLifeRing />
              <span>Support</span>
            </div>
          )}
          
          <button onClick={handleLogout} className="sidebar-logout">
            <FaSignOutAlt />
            {!collapsed && <span>Logout</span>}
          </button>

          {onToggleCollapse && (
            <button className="sidebar-collapse-toggle" onClick={onToggleCollapse}>
              <FaBars />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
    </>
  );
};

export default DashboardSidebar;