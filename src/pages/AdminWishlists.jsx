import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart, FaTrash, FaStar, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URI;

const AdminWishlists = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const token = localStorage.getItem("adminAccessToken");
        const res = await axios.get(`${API}/api/admin/wishlists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data || []);
      } catch (err) {
        console.error("Failed to load wishlists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlists();
  }, []);

  const filtered = data.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Customer Wishlists
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {data.length} customers have items in their wishlists
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaHeart className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">
              {search ? "No customers match your search" : "No wishlists found"}
            </p>
            <p className="text-sm">
              {search ? "Try a different name or email" : "Customers haven't added any products to their wishlists yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpanded(expanded === user._id ? null : user._id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white font-bold">
                      {user.firstName?.[0] || "?"}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-medium">
                      {Array.isArray(user.wishlist) ? user.wishlist.length : 0} items
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expanded === user._id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expanded === user._id && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {Array.isArray(user.wishlist) && user.wishlist.length > 0 ? (
                      user.wishlist.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <img
                            src={product.mainImage || "/placeholder.jpg"}
                            alt={product.name}
                            className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${product._id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="font-semibold text-gray-700">
                                BDT{product.discountPrice || product.mainPrice}
                              </span>
                              {product.brand && (
                                <span className="text-gray-400">{product.brand}</span>
                              )}
                              {product.averageRating > 0 && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <FaStar size={12} />
                                  {product.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No product details available
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWishlists;
