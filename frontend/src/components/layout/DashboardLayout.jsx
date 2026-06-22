import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ activeView, onViewChange, activeItem, children }) => {
  const navigationItems = [
    { id: 'attendance', label: 'Điểm danh', icon: 'DD' },
    { id: 'students', label: 'Sinh viên', icon: 'SV' },
    { id: 'history', label: 'Lịch sử', icon: 'XL' },
  ];

  return (
    <div className="dashboard-shell">
      <Sidebar
        items={navigationItems}
        activeView={activeView}
        onViewChange={onViewChange}
      />

      <main className="dashboard-main">
        <div className="dashboard-main-header">
          <div>
            <h1 className="dashboard-title">{activeItem.title}</h1>
            <p className="dashboard-subtitle">{activeItem.subtitle}</p>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
