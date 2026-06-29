import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaUser, FaUserShield, FaStore } from 'react-icons/fa';
import '../../styles/dashboard.css';

const getRoleIcon = (role) => {
  if (role === 'admin') return FaUserShield;
  if (role === 'vendor') return FaStore;
  return FaUser;
};

const getDisplayName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return fullName || user?.name || user?.email || 'Unknown user';
};

const UserManagement = ({ users = [], loading = false, simple = false }) => {
  if (loading) {
    return (
      <div className="user-management">
        <div className="section-header">
          <h2>Recent Users</h2>
        </div>
        <div className="user-list-loading">
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>{simple ? 'Recent Users' : 'User Management'}</h2>
        {simple && <Link to="/admin/users" className="view-all">View All</Link>}
      </div>

      {users.length === 0 ? (
        <div className="user-management-empty">
          <p>No users found</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                {!simple && <th>Email</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const userId = user._id || user.id;

                return (
                  <tr key={userId || user.email}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{getDisplayName(user)}</strong>
                          {simple && <span>{user.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${user.role || 'user'}`}>
                        <RoleIcon />
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive === false ? 'inactive' : 'active'}`}>
                        {user.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    {!simple && <td>{user.email}</td>}
                    <td>
                      <Link to={`/admin/users/${userId}`} className="view-order-btn">
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
