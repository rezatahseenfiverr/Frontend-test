import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaBoxOpen, FaPhone, FaUserAlt, FaShoppingCart, FaClipboardList } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

const MobileTabBar = () => {
  const { cartItems } = useContext(CartContext);
  const { isLoggedIn } = useContext(UserContext);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg border-t border-yellow-300 md:hidden flex justify-around z-50 py-1">
      <NavLink
        to="/home"
        className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition"
        style={{ minWidth: 50 }}
      >
        <FaHome size={20} />
        <span className="text-xs font-semibold">Home</span>
      </NavLink>
      <NavLink
        to="/products"
        className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition"
        style={{ minWidth: 50 }}
      >
        <FaBoxOpen size={20} />
        <span className="text-xs font-semibold">Products</span>
      </NavLink>
      {isLoggedIn && (
        <NavLink
          to="/profile/orders"
          className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition"
          style={{ minWidth: 50 }}
        >
          <FaClipboardList size={20} />
          <span className="text-xs font-semibold">Orders</span>
        </NavLink>
      )}
      <NavLink
        to="/contactus"
        className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition"
        style={{ minWidth: 50 }}
      >
        <FaPhone size={20} />
        <span className="text-xs font-semibold">Contact</span>
      </NavLink>
      <NavLink
        to={isLoggedIn ? "/profile" : "/login"}
        className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition"
        style={{ minWidth: 50 }}
      >
        <FaUserAlt size={20} />
        <span className="text-xs font-semibold">{isLoggedIn ? "Account" : "Login"}</span>
      </NavLink>
      <NavLink
        to="/cart"
        className="flex flex-col items-center text-gray-900 hover:text-black px-2 py-1 transition relative"
        style={{ minWidth: 50 }}
      >
        <div className="relative">
          <FaShoppingCart size={20} />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold shadow">
              {cartItems.length}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold">Cart</span>
      </NavLink>
    </div>
  );
};

export default MobileTabBar;
