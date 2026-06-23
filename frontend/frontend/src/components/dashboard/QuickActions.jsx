import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaShoppingBag, 
  FaBox, 
  FaUserPlus,
  FaFileInvoice,
  FaChartBar,
  FaGift,
  FaEnvelope,
  FaBell,
  FaCog,
  FaArrowRight,
  FaStore,
  FaHeart,
  FaComments,
  FaStar
} from 'react-icons/fa';
import '../../styles/dashboard.css';

const QuickActions = ({ role = 'user', actions = [], className = '' }) => {
  // Default actions based on role
  const getDefaultActions = () => {
    const commonActions = [
      { 
        icon: FaShoppingBag, 
        label: 'Browse Products', 
        link: '/products',
        color: '#667eea',
        description: 'Shop our latest collection'
      },
      { 
        icon: FaSearch, 
        label: 'Search', 
        link: '/products',
        color: '#48bb78',
        description: 'Find what you need'
      }
    ];

    const userActions = [
      { 
        icon: FaBox, 
        label: 'My Orders', 
        link: '/orders',
        color: '#f6ad55',
        description: 'Track your orders'
      },
      { 
        icon: FaHeart, 
        label: 'Wishlist', 
        link: '/wishlist',
        color: '#ed64a6',
        description: 'Saved items'
      }
    ];

    const vendorActions = [
      { 
        icon: FaPlus, 
        label: 'Add Product', 
        link: '/vendor/products/new',
        color: '#48bb78',
        description: 'List new product'
      },
      { 
        icon: FaStore, 
        label: 'Manage Store', 
        link: '/vendor/store',
        color: '#667eea',
        description: 'Store settings'
      },
      { 
        icon: FaChartBar, 
        label: 'Analytics', 
        link: '/vendor/analytics',
        color: '#f6ad55',
        description: 'View performance'
      }
    ];

    const adminActions = [
      { 
        icon: FaUserPlus, 
        label: 'Add User', 
        link: '/admin/users/new',
        color: '#667eea',
        description: 'Create new user'
      },
      { 
        icon: FaFileInvoice, 
        label: 'Reports', 
        link: '/admin/reports',
        color: '#48bb78',
        description: 'Generate reports'
      },
      { 
        icon: FaCog, 
        label: 'Settings', 
        link: '/admin/settings',
        color: '#a0aec0',
        description: 'System settings'
      },
      { 
        icon: FaGift, 
        label: 'Promotions', 
        link: '/admin/promotions',
        color: '#ed64a6',
        description: 'Manage promotions'
      }
    ];

    let actions = [...commonActions];
    if (role === 'user') {
      actions = [...actions, ...userActions];
    } else if (role === 'vendor') {
      actions = [...actions, ...vendorActions];
    } else if (role === 'admin') {
      actions = [...actions, ...adminActions];
    }

    return actions;
  };

  const displayActions = actions.length > 0 ? actions : getDefaultActions();

  return (
    <div className={`quick-actions ${className}`}>
      <div className="section-header">
        <h2>Quick Actions</h2>
        <span className="section-subtitle">Get things done faster</span>
      </div>

      <div className="quick-actions-grid">
        {displayActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="quick-action-card"
            style={{ borderLeft: `4px solid ${action.color}` }}
          >
            <div className="action-content">
              <div className="action-icon-wrapper" style={{ background: action.color + '15' }}>
                <action.icon className="action-icon" style={{ color: action.color }} />
              </div>
              <div className="action-info">
                <span className="action-label">{action.label}</span>
                {action.description && (
                  <span className="action-description">{action.description}</span>
                )}
              </div>
            </div>
            <FaArrowRight className="action-arrow" />
          </Link>
        ))}
      </div>

      {/* Quick Stats or Tips */}
      <div className="quick-actions-footer">
        <div className="quick-tip">
          <FaBell className="tip-icon" />
          <span>Need help? Check our <Link to="/help">Help Center</Link></span>
        </div>
        {role === 'vendor' && (
          <div className="quick-tip">
            <FaStar className="tip-icon" />
            <span>Your store rating: <strong>4.8 ★</strong></span>
          </div>
        )}
        {role === 'admin' && (
          <div className="quick-tip">
            <FaComments className="tip-icon" />
            <span>New support tickets: <strong>3</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActions;