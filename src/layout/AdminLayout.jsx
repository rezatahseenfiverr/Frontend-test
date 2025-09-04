import { Outlet } from "react-router-dom";
import { AdminProvider } from "../context/AdminContext";
import { AdminChatProvider } from "../context/AdminChatContext";

function AdminLayout() {
  return (
    <AdminProvider>
      <AdminChatProvider>
        <div className="flex flex-col min-h-screen">
          <Outlet />
        </div>
      </AdminChatProvider>
    </AdminProvider>
  );
}

export default AdminLayout;
