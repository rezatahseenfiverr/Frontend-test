import AdminNavbar from '../components/AdminNavbar';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminBreadcrumb from '../components/AdminBreadcrumb';

const AdminDashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAdmin();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!loading && !isAuthenticated) {
    navigate('/admin');
    return null;
  }

  return (
    <div className="dark">
      <AdminNavbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1">
        <div className="mt-16 mb-0">
         <AdminBreadcrumb/>
        </div>
        <Outlet/>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default AdminDashBoard;