import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaShoppingCart, 
  FaUser, 
  FaSearch, 
  FaBars, 
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
  FaStore,
  FaHeart,
  FaCog,
  FaBox,
  FaChartBar
} from 'react-icons/fa';
import { logout } from '../../redux/slices/authSlice';
import { closeCart, toggleCart } from '../../redux/slices/cartSlice';
import CartIcon from '../cart/CartIcon';
import SearchBar from './SearchBar';
import '../../styles/navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartCount = items?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    if (isAuthenticated) {
      navigate('/cart');
    } else {
      navigate('/login', { state: { from: '/cart' } });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-text">ShopVerse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-links desktop-nav">
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/categories" className="nav-link">Categories</Link>
          {isAuthenticated && user?.role === 'vendor' && (
            <Link to="/vendor/dashboard" className="nav-link">Vendor</Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="nav-link">Admin</Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <SearchBar />

          {isAuthenticated ? (
            <>
              <button 
                className="cart-btn" 
                onClick={handleCartClick}
                aria-label="Cart"
              >
                <FaShoppingCart />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </button>

              <div className="user-menu-wrapper">
                <button 
                  className="user-menu-btn" 
                  onClick={toggleUserMenu}
                  aria-label="User menu"
                >
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.firstName} 
                      className="user-avatar"
                    />
                  ) : (
                    <FaUserCircle className="user-icon" />
                  )}
                  <span className="user-name">{user?.firstName}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="user-info">
                        <span className="user-name-display">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="user-email">{user?.email}</span>
                        <span className={`user-role ${user?.role}`}>
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-items">
                      <Link to="/profile" className="dropdown-item">
                        <FaUser /> Profile
                      </Link>
                      <Link to="/orders" className="dropdown-item">
                        <FaBox /> My Orders
                      </Link>
                      <Link to="/wishlist" className="dropdown-item">
                        <FaHeart /> Wishlist
                      </Link>
                      <Link to="/settings" className="dropdown-item">
                        <FaCog /> Settings
                      </Link>
                      
                      {user?.role === 'vendor' && (
                        <Link to="/vendor/dashboard" className="dropdown-item">
                          <FaStore /> Vendor Dashboard
                        </Link>
                      )}
                      
                      {user?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="dropdown-item">
                          <FaChartBar /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="dropdown-footer">
                      <button onClick={handleLogout} className="logout-btn">
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-items">
            <Link to="/products" className="mobile-nav-link">Products</Link>
            <Link to="/categories" className="mobile-nav-link">Categories</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="mobile-nav-link">
                  <FaUser /> Profile
                </Link>
                <Link to="/orders" className="mobile-nav-link">
                  <FaBox /> My Orders
                </Link>
                <Link to="/wishlist" className="mobile-nav-link">
                  <FaHeart /> Wishlist
                </Link>
                <Link to="/cart" className="mobile-nav-link">
                  <FaShoppingCart /> Cart
                  {cartCount > 0 && (
                    <span className="mobile-cart-count">{cartCount}</span>
                  )}
                </Link>
                
                {user?.role === 'vendor' && (
                  <Link to="/vendor/dashboard" className="mobile-nav-link">
                    <FaStore /> Vendor Dashboard
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="mobile-nav-link">
                    <FaChartBar /> Admin Dashboard
                  </Link>
                )}

                <button onClick={handleLogout} className="mobile-logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-outline mobile-btn">Login</Link>
                <Link to="/register" className="btn btn-primary mobile-btn">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;