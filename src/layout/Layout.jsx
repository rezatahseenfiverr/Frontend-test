"use client";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { Outlet } from "react-router-dom";
import MobileTabBar from "../components/TabBar";
import ChatDrawer from "../components/ChatDrawer";
import { CartProvider } from "../context/CartContext";
import { UserProvider } from "../context/UserContext";
import { UserChatProvider } from "../context/UserChatContext";

function Layout() {
  return (
    <UserProvider>
      <UserChatProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <Breadcrumb />
            <main className="mobile-padding">
              <Outlet />
            </main>
            <MobileTabBar />
            <ChatDrawer />
          </div>
        </CartProvider>
      </UserChatProvider>
    </UserProvider>
  );
}

export default Layout;
