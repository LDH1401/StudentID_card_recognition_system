import React from 'react';

const Sidebar = ({ items, activeView, onViewChange }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="PTIT" className="sidebar-logo" />
        <div>
          <div className="sidebar-title">PTIT</div>
          <div className="sidebar-subtitle">Điểm danh</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng dashboard">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link ${activeView === item.id ? 'sidebar-link-active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
