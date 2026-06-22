import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScanPage from './pages/ScanPage';
import DashboardPage from './pages/DashboardPage';
import { NotificationProvider } from './components/notifications/NotificationProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
export default App;
