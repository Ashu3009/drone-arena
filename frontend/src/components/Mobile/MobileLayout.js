import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import './MobileLayout.css';

const MobileLayout = () => {
  return (
    <div className="mobile-layout">
      <MobileHeader />

      <main className="mobile-main">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default MobileLayout;
