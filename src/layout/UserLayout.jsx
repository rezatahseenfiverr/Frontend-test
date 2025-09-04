import React from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Sidebar Component */}
      <UserSidebar />

      {/* Main Content Area */}
      <div className="lg:ml-80">
        {/* Mobile top spacing for header */}
        <div className="lg:hidden h-20"></div>
        
        {/* Outlet Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <Outlet />
        </div>
        
        {/* Mobile bottom spacing for bottom navigation */}
        <div className="lg:hidden h-20"></div>
      </div>
    </div>
  );
};

export default UserLayout;
