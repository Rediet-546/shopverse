import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import '../../styles/dashboard.css';

const DashboardStats = ({ stats }) => {
  return (
    <div className="dashboard-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: stat.color + '20' }}>
            <stat.icon className="stat-icon" style={{ color: stat.color }} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{stat.title}</span>
            <span className="stat-value">{stat.value}</span>
            {stat.trend && (
              <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                {stat.trendUp ? <FaArrowUp /> : <FaArrowDown />}
                <span>{stat.trend}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;