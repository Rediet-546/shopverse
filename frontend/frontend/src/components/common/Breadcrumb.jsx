import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';
import '../../styles/breadcrumb.css';

const Breadcrumb = ({ items = [], homeLabel = 'Home' }) => {
  const location = useLocation();

  // If no items provided, generate from path
  if (items.length === 0) {
    const pathnames = location.pathname.split('/').filter(x => x);
    items = pathnames.map((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      return {
        label: value.charAt(0).toUpperCase() + value.slice(1),
        path: path,
        isLast
      };
    });
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <FaHome className="breadcrumb-home" />
            {homeLabel}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            <FaChevronRight className="breadcrumb-separator" />
            {item.isLast ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;