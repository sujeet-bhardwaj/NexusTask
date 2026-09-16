import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Briefcase, 
  Settings, 
  Sparkles
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, allUsers, switchUser } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'MANAGER': return 'role-manager';
      default: return 'role-member';
    }
  };

  return (
    <header>
      {/* 1-Click Persona Switcher for Assignment Evaluation */}
      <div className="persona-bar">
        <div className="persona-bar-title">
          <Sparkles size={14} color="#818cf8" />
          <span>Quick Switch Persona:</span>
        </div>
        <div className="persona-pills">
          {allUsers.map((u) => {
            const isActive = user?.id === u.id;
            let roleShort = 'TM';
            if (u.role === 'ADMIN') roleShort = 'Admin';
            if (u.role === 'MANAGER') roleShort = 'Mgr';

            return (
              <button
                key={u.id}
                className={`persona-pill ${isActive ? 'active' : ''}`}
                onClick={() => switchUser(u.id)}
                title={`${u.name} (${u.title}) - ${u.email}`}
              >
                <span>{u.name.split(' ')[0]}</span>
                <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>[{roleShort}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('dashboard')}>
            <div className="brand-icon">NT</div>
            <div className="brand-text">
              <h1>NexusTask</h1>
              <span>Engagement & Workflow OS</span>
            </div>
          </div>

          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-tab ${currentTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setCurrentTab('tasks')}
            >
              <CheckSquare size={16} />
              <span>Tasks & Workflow</span>
            </button>
            <button
              className={`nav-tab ${currentTab === 'engagements' ? 'active' : ''}`}
              onClick={() => setCurrentTab('engagements')}
            >
              <Briefcase size={16} />
              <span>Engagements</span>
            </button>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button
                className={`nav-tab ${currentTab === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentTab('admin')}
              >
                <Settings size={16} />
                <span>Admin & Catalog</span>
              </button>
            )}
          </div>

          <div className="user-profile-badge">
            <div className="user-info" style={{ textAlign: 'right' }}>
              <span className="user-name">{user?.name || 'Guest'}</span>
              <span className={`user-role-tag ${getRoleBadgeClass(user?.role)}`}>
                {user?.role?.replace('_', ' ')} • {user?.title}
              </span>
            </div>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar" />
            ) : (
              <div className="assignee-avatar" style={{ width: 38, height: 38 }}>
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
