import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaSearch, FaUser, FaSignOutAlt, FaBars, FaTimes, FaHeart } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

export default function AmazonNavbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems } = useContext(CartContext);
  const { isLoggedIn, logout } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URI}/api/products`)
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  const handleProductClick = () => {
    setShowDropdown(false);
    setSearchQuery("");
    setShowMobileMenu(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
      setShowMobileMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500'
      }`}>
        <div className="max-w-7xl mx-auto container-padding-mobile">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ${
                isScrolled ? 'bg-yellow-500' : 'bg-white/20'
              }`}>
                <img 
                  src="/Barvella.png" 
                  alt="Barvella Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <span className={`font-bold text-lg sm:text-xl tracking-wide ${
                isScrolled ? 'text-gray-900' : 'text-white'
              } group-hover:scale-105 transition-transform duration-300`}>
                Barvella
              </span>
            </NavLink>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 mx-8 max-w-2xl relative">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products, brands and more..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={`w-full px-4 py-2 pl-10 rounded-full outline-none transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-yellow-500' 
                        : 'bg-white/90 text-gray-900 border border-white/20 focus:border-white'
                    }`}
                  />
                  <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isScrolled ? 'text-gray-500' : 'text-gray-600'
                  }`} />
                  <button
                    type="submit"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-full font-semibold transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    Search
                  </button>
                </div>
                
                {/* Search Dropdown */}
                {showDropdown && (
                  <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.slice(0, 5).map((product) => (
                        <NavLink
                          to={`/products/${product._id}`}
                          key={product._id}
                          onClick={handleProductClick}
                          className="flex items-center gap-3 p-3 hover:bg-yellow-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="text-sm text-gray-500">${product.mainPrice}</div>
                          </div>
                        </NavLink>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <div className="text-2xl mb-2">🔍</div>
                        <p>No products found</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <NavLink
                to="/products"
                className={`font-semibold transition-all duration-300 hover:scale-105 ${
                  isScrolled ? 'text-gray-700 hover:text-yellow-600' : 'text-white hover:text-yellow-200'
                }`}
              >
                Products
              </NavLink>
              <NavLink
                to="/contactus"
                className={`font-semibold transition-all duration-300 hover:scale-105 ${
                  isScrolled ? 'text-gray-700 hover:text-yellow-600' : 'text-white hover:text-yellow-200'
                }`}
              >
                Contact Us
              </NavLink>
              
              {/* User Actions */}
              <div className="flex items-center gap-4">
                {isLoggedIn ? (
                  <>
                    <NavLink
                      to="/profile"
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                        isScrolled ? 'text-gray-700 hover:bg-yellow-100' : 'text-white hover:bg-white/20'
                      }`}
                    >
                      <FaUser size={20} />
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                        isScrolled ? 'text-gray-700 hover:bg-red-100' : 'text-white hover:bg-red-500/20'
                      }`}
                    >
                      <FaSignOutAlt size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className={`font-semibold transition-all duration-300 hover:scale-105 ${
                        isScrolled ? 'text-gray-700 hover:text-yellow-600' : 'text-white hover:text-yellow-200'
                      }`}
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/signup"
                      className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                        isScrolled 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-white hover:bg-gray-100 text-orange-600'
                      }`}
                    >
                      Sign Up
                    </NavLink>
                  </>
                )}
                
                {/* Cart */}
                <NavLink
                  to="/cart"
                  className={`relative p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    isScrolled ? 'text-gray-700 hover:bg-yellow-100' : 'text-white hover:bg-white/20'
                  }`}
                >
                  <FaShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold animate-pulse">
                      {cartItems.length}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`lg:hidden p-2 rounded-full transition-all duration-300 ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
              }`}
            >
              {showMobileMenu ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileMenu && (
          <div className="lg:hidden px-4 pb-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 pl-10 rounded-full bg-white/90 text-gray-900 border border-white/20 focus:border-white outline-none"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-xl rounded-b-2xl mx-4 mt-2 p-6 sm:p-8 animate-fade-in max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/Barvella.png" 
                    alt="Barvella Logo" 
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <span className="font-bold text-xl text-gray-900">Barvella</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <NavLink
                to="/products"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-yellow-50 transition-colors duration-200 text-gray-700 font-semibold touch-target"
              >
                <span className="text-2xl">🛍️</span>
                <span className="text-lg">Products</span>
              </NavLink>
              
              <NavLink
                to="/contactus"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-yellow-50 transition-colors duration-200 text-gray-700 font-semibold touch-target"
              >
                <span className="text-2xl">📞</span>
                <span className="text-lg">Contact Us</span>
              </NavLink>

              {isLoggedIn ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-yellow-50 transition-colors duration-200 text-gray-700 font-semibold touch-target"
                  >
                    <FaUser size={24} />
                    <span className="text-lg">Profile</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-red-50 transition-colors duration-200 text-gray-700 font-semibold w-full text-left touch-target"
                  >
                    <FaSignOutAlt size={24} />
                    <span className="text-lg">Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <NavLink
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full text-center py-4 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-700 font-semibold touch-target text-lg"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full text-center py-4 px-6 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors duration-200 touch-target text-lg"
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}
