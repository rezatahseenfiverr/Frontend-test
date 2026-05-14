import { Outlet } from "react-router-dom";
import { AdminProvider } from "../context/AdminContext";
import { AdminChatProvider } from "../context/AdminChatContext";
import ModernShell from "../components/ModernShell";

function AdminLayout() {
  return (
    <AdminProvider>
      <AdminChatProvider>
        <ModernShell>
          <div className="flex flex-col min-h-screen">
            <Outlet />
          </div>
        </ModernShell>
      </AdminChatProvider>
    </AdminProvider>
  );
}

export default AdminLayout;
