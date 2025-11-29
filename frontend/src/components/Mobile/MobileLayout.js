import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import './MobileLayout.css';

const MobileLayout = ({ children }) => {
  return (
    <div className="mobile-layout">
      <MobileHeader />

      <main className="mobile-main">
        {/* Support both children (for responsive rendering) and Outlet (for routes) */}
        {children || <Outlet />}
      </main>

      <BottomNav />
    </div>
  );
};

export default MobileLayout;
