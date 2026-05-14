import React, { useEffect, useContext, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartContext } from '../context/CartContext';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag, FaTag, FaCreditCard } from 'react-icons/fa';

function CartPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(UserContext);
  const {
    cartItems = [],
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    coupon,
    discount,
    totalPrice,
    isLoading,
    updateQuantity
  } = useContext(CartContext);

  const [localQuantities, setLocalQuantities] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Debug logs for discount and coupon updates
  useEffect(() => {
    console.log("Discount value:", discount);
    console.log("Coupon object:", coupon);
  }, [discount, coupon]);

  useEffect(() => {
    const quantities = {};
    cartItems.forEach(item => {
      const identifier = isLoggedIn ? item._id : item.guestItemId;
      quantities[identifier] = item.quantity.toString();
    });
    setLocalQuantities(quantities);
  }, [cartItems, isLoggedIn]);

  const handleQuantityChange = (itemIdentifier, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    const numericValue = Math.max(1, parseInt(sanitizedValue, 10) || 1);
    setLocalQuantities(prev => ({
      ...prev,
      [itemIdentifier]: sanitizedValue
    }));
    updateQuantity(itemIdentifier, numericValue);
  };

  const toastConfig = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Ensure discount is number and default to 0 if falsy
  const total = subtotal - (discount || 0);
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);

  const getItemIdentifier = (item) => {
    return isLoggedIn ? item._id : item.guestItemId;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setLocalLoading(true);
    setCouponError(null);

    const result = await applyCoupon(couponCode);

    if (result.success) {
      toast.success(result.message, toastConfig);
      setCouponCode("");
    } else {
      setCouponError(result.message);
      if (result.details) {
        console.log("Coupon validation details:", result.details);
      }
    }

    setLocalLoading(false);
  };

  const handleRemoveCoupon = async () => {
    setLocalLoading(true);
    try {
      await removeCoupon();
      toast.info("Coupon removed!", toastConfig);
    } catch (error) {
      toast.error("Error removing coupon", toastConfig);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto container-padding-mobile">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Shopping Cart
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Review your items and proceed to checkout
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto container-padding-mobile py-6 sm:py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 max-w-md mx-auto">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🛒</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Your cart is empty</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg touch-target text-sm sm:text-base"
              >
                <FaShoppingBag className="inline mr-2" />
                Start Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Cart Items ({cartItems.length})
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors duration-200 touch-target"
                      disabled={isLoading || localLoading}
                    >
                      <FaTrash size={12} className="sm:w-3.5 sm:h-3.5" />
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    {cartItems.map((item) => {
                      const originalPrice = item.price * item.quantity;
                      const discountPercentage = item.discountApplied > 0
                        ? Math.round((item.discountApplied / originalPrice) * 100)
                        : 0;
                      const itemIdentifier = getItemIdentifier(item);

                      return (
                        <div
                          key={itemIdentifier}
                          className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                              <img
                                src={item.mainImage}
                                alt={item.name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                              />
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                  {item.name}
                                </h3>
                                
                                {/* Product Variants */}
                                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                                  {item.size && (
                                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {item.measureType}: {item.size} {item.unitName || ''}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Color: {item.color}
                                    </span>
                                  )}
                                </div>

                                {/* Price Display */}
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                                    BDT{item.price.toFixed(2)}
                                  </span>
                                  {item.discountApplied > 0 && (
                                    <span className="text-xs sm:text-sm text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                      -BDT{item.discountApplied.toFixed(2)} ({discountPercentage}% off)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex flex-col items-end gap-3 sm:gap-4">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <button
                                    onClick={() => decreaseQuantity(itemIdentifier)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 disabled:opacity-50 touch-target"
                                    disabled={isLoading || localLoading}
                                  >
                                    <FaMinus size={10} className="sm:w-3 sm:h-3 text-gray-600" />
                                  </button>
                                  <input
                                    type="text"
                                    value={localQuantities[itemIdentifier] || ''}
                                    onChange={(e) => handleQuantityChange(itemIdentifier, e.target.value)}
                                    className="w-12 sm:w-16 h-7 sm:h-8 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    disabled={isLoading || localLoading}
                                  />
                                  <button
                                    onClick={() => increaseQuantity(itemIdentifier)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 disabled:opacity-50 touch-target"
                                    disabled={isLoading || localLoading}
                                  >
                                    <FaPlus size={10} className="sm:w-3 sm:h-3 text-gray-600" />
                                  </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => removeItem(itemIdentifier)}
                                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors duration-200 touch-target"
                                  disabled={isLoading || localLoading}
                                >
                                  <FaTrash size={10} className="sm:w-3.5 sm:h-3.5" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 sticky top-24">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 flex items-center gap-2">
                  <FaCreditCard className="text-blue-500" />
                  Order Summary
                </h3>

                {/* Coupon Section */}
                <div className="mb-6">
                  {coupon ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaTag className="text-green-600" />
                          <div>
                            <p className="text-green-800 font-semibold">{coupon.code}</p>
                            <p className="text-sm text-green-600">
                              {coupon.discount > 0 && `-BDT${coupon.discount.toFixed(2)} discount applied`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                          disabled={isLoading || localLoading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                          }}
                          placeholder="Enter coupon code"
                          className={`flex-1 px-4 py-3 border rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            couponError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isLoading || localLoading}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-r-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold disabled:opacity-50"
                          disabled={isLoading || localLoading || !couponCode.trim()}
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-500 text-sm">{couponError}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Have a coupon code? Enter it above to apply your discount.
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">BDT{formattedSubtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center py-2 text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-BDT{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">BDT{formattedTotal}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("../checkout")}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    disabled={isLoading || localLoading}
                  >
                    <FaCreditCard className="inline mr-2" />
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => navigate("/products")}
                    className="w-full bg-white border-2 border-blue-500 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FaArrowLeft />
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
