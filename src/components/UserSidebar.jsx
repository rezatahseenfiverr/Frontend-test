import React, { useState, useContext } from "react";
import { 
  FaBox, 
  FaInbox, 
  FaTrash, 
  FaUser, 
  FaHome, 
  FaSignOutAlt, 
  FaBars,
  FaTimes
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const UserSidebar = () => {
  const { logout, user } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion logic here
      console.log('Delete account clicked');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const menuItems = [
    {
      path: "/profile",
      icon: <FaUser className="text-xl" />,
      label: "Profile",
      description: "Manage your account"
    },
    {
      path: "/profile/orders",
      icon: <FaBox className="text-xl" />,
      label: "Orders",
      description: "View your orders"
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path)
                  ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              <div className={`transition-colors duration-200 ${
                isActive(item.path) ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
            <span className="font-medium">Logout</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          >
            <FaTrash className="text-red-500" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            {isMobileMenuOpen ? <FaTimes className="text-gray-600" /> : <FaBars className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path)
                  ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              <div className={`transition-colors duration-200 ${
                isActive(item.path) ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Mobile Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
            <span className="font-medium">Logout</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          >
            <FaTrash className="text-red-500" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Removed since TabBar is hidden on profile pages */}
    </>
  );
};

export default UserSidebar;
