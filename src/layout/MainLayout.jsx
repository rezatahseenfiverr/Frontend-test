import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <Navbar />
      <main className="mobile-padding">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
