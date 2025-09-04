import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaMoneyBillAlt, 
  FaMobileAlt, 
  FaTrash, 
  FaCreditCard, 
  FaPlus, 
  FaMapMarkerAlt, 
  FaTruck, 
  FaLock, 
  FaShieldAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaGlobe,
  FaHome,
  FaShoppingBag
} from "react-icons/fa";

function CheckoutPage() {
  const {
    cartItems = [],
    discount = 0,
    coupon = null,
    clearCart,
    removeItem,
  } = useContext(CartContext);

  const {
    user,
    address,
    paymentMethods,
    defaultPaymentMethod,
    isLoggedIn,
    updateAddress,
    addPaymentMethod,
  } = useContext(UserContext);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.fullName || "",
    address: address?.street || "",
    city: address?.city || "",
    postalCode: address?.zipCode || "",
    state: address?.state || "",
    country: address?.country || "",
    phone: user?.phoneNumber || "",
  });
  
  const [useSavedAddress, setUseSavedAddress] = useState(!!address);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(defaultPaymentMethod || null);
  const [addingNewPayment, setAddingNewPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: "bkash",
    walletNumberMasked: "",
    msisdn: "",
    label: "",
    isDefault: false,
  });
  const [transactionNumber, setTransactionNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (address && useSavedAddress) {
      setShippingInfo({
        fullName: user?.fullName || "",
        address: address.street || "",
        city: address.city || "",
        postalCode: address.zipCode || "",
        state: address.state || "",
        country: address.country || "",
        phone: user?.phoneNumber || "",
      });
    } else {
      setShippingInfo({
        fullName: "",
        address: "",
        city: "",
        postalCode: "",
        state: "",
        country: "",
        phone: "",
      });
    }
  }, [address, useSavedAddress, user]);

  useEffect(() => {
    if (defaultPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod);
    }
  }, [defaultPaymentMethod]);

  // Fetch shipping options from centralized Shipping model
  useEffect(() => {
    const loadShipping = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/api/shipping`);
        if (!res.ok) throw new Error('Failed to fetch shipping options');
        const shippingData = await res.json();
        
        // Filter only active shipping methods
        const activeShipping = shippingData.filter(shipping => shipping.isActive);
        setShippingOptions(activeShipping);
        setSelectedShipping(activeShipping[0] || null);
      } catch (e) {
        console.error('shipping load error', e);
        setShippingOptions([]);
        setSelectedShipping(null);
      }
    };
    loadShipping();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPaymentMethod((prev) => ({ ...prev, [name]: value }));
  };

  const validateShippingInfo = () => {
    const requiredFields = ["fullName", "address", "city", "postalCode", "country", "phone"];
    for (const field of requiredFields) {
      if (!shippingInfo[field]?.trim()) {
        toast.error(`Please enter a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        return false;
      }
    }
    return true;
  };

  const mainTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountPercentage = (discount / mainTotal) * 100;
  const shippingCharge = selectedShipping?.charge ? Number(selectedShipping.charge) : 0;
  const totalAfterDiscount = mainTotal - discount;
  const grandTotal = totalAfterDiscount + shippingCharge;

const handleCheckout = async () => {
  // Validate shipping info
  if (!validateShippingInfo()) return;

  // Prepare shipping address
  const orderShippingAddress = useSavedAddress ? {
    fullName: user?.fullName || "",
    address: address?.street || "",
    city: address?.city || "",
    postalCode: address?.zipCode || "",
    state: address?.state || "",
    country: address?.country || "",
    phone: user?.phoneNumber || ""
  } : {
    fullName: shippingInfo.fullName,
    address: shippingInfo.address,
    city: shippingInfo.city,
    postalCode: shippingInfo.postalCode,
    state: shippingInfo.state,
    country: shippingInfo.country,
    phone: shippingInfo.phone
  };

  // Validate payment method
  if (!selectedPaymentMethod) {
    toast.error("Please select a payment method.");
    return;
  }

  // Validate mobile payment details
  const isMobilePayment = ['bkash', 'nagad'].includes(selectedPaymentMethod.type.toLowerCase());
  if (isMobilePayment) {
    if (!transactionNumber.trim()) {
      toast.error("Please provide a valid transaction number.");
      return;
    }
    if (!/^[a-zA-Z0-9]{8,}$/.test(transactionNumber.trim())) {
      toast.error("Transaction number must be at least 8 alphanumeric characters");
      return;
    }
  }

  // Validate cart
  if (!cartItems.length) {
    toast.error("Your cart is empty.");
    return;
  }

  setLoading(true);

  try {
    // Prepare payment method
    const paymentMethodToSend = selectedPaymentMethod.type === 'cash' 
      ? 'Cash on Delivery' 
      : selectedPaymentMethod.type;

    // Prepare order data
    const orderData = {
      userId: user._id,
      items: cartItems.map((item) => ({
        variantId: item.variantId,
        productId: item.productId,
        discountApplied: item.discountApplied || 0,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        mainImage: item.mainImage,
        size: item.size,
        color: item.color,
        measureType: item.measureType,
        unitName: item.unitName,
      })),
      totalAmount: mainTotal, // This should be the subtotal (before discount and shipping)
      shipping: selectedShipping ? {
        name: selectedShipping.name,
        charge: shippingCharge,
        estimatedDays: selectedShipping.estimatedDays || 0,
      } : null,
      shippingCost: shippingCharge,
      grandTotal: grandTotal, // This is the final total (subtotal - discount + shipping)
      discountAmount: discount,
      couponCode: coupon?.code || null,
      shippingAddress: orderShippingAddress,
      paymentMethod: paymentMethodToSend,
      selectedPaymentMethodId: selectedPaymentMethod._id || selectedPaymentMethod.methodId,
      paymentDetails: isMobilePayment ? { 
        trxId: transactionNumber.trim(),
        walletNumberMasked: selectedPaymentMethod.walletNumberMasked,
        paymentMethod: selectedPaymentMethod.type
      } : {},
    };

    // Submit order
    const response = await fetch(`${import.meta.env.VITE_API_URI}/api/order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(orderData),
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to place order");
    }

    const result = await response.json();
    
    // Clear cart and show success
    clearCart();
    toast.success("Order placed successfully!");
    
    // Redirect to confirmation page
    navigate(`/profile/orders/order-confirmation/${result.orderId}`, {
      state: {
        order: result,
        paymentMethod: paymentMethodToSend,
        transactionNumber: isMobilePayment ? transactionNumber : null
      }
    });

  } catch (error) {
    console.error("Checkout error:", error);
    
    // More specific error messages
    let errorMessage = "Failed to place order. Please try again later.";
    if (error.message.includes("network")) {
      errorMessage = "Network error. Please check your connection and try again.";
    } else if (error.message.includes("validation")) {
      errorMessage = "Invalid order data. Please check your information.";
    }
    
    toast.error(error.message || errorMessage);
    
    // Log error to analytics if available
    if (window.analytics) {
      window.analytics.track('Checkout Error', {
        error: error.message,
        userId: user?._id
      });
    }
  } finally {
    setLoading(false);
  }
};

  const renderPaymentIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'card':
        return <FaCreditCard className="mr-2 text-blue-500" />;
      case 'bkash':
        return <FaMobileAlt className="mr-2 text-[#e2136e]" />;
      case 'nagad':
        return <FaMobileAlt className="mr-2 text-[#e21818]" />;
      case 'cash':
        return <FaMoneyBillAlt className="mr-2 text-gray-500" />;
      default:
        return <FaMoneyBillAlt className="mr-2" />;
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.walletNumberMasked) {
      toast.error("Please enter a valid wallet number");
      return;
    }

    try {
      const paymentDetails = {
        type: newPaymentMethod.type,
        walletNumberMasked: newPaymentMethod.walletNumberMasked,
        msisdn: newPaymentMethod.msisdn,
        label: newPaymentMethod.label || `${newPaymentMethod.type} ${newPaymentMethod.walletNumberMasked}`,
        isDefault: newPaymentMethod.isDefault,
      };

      const addedMethod = await addPaymentMethod(paymentDetails);
      setSelectedPaymentMethod(addedMethod);
      setAddingNewPayment(false);
      toast.success("Payment method added successfully!");
    } catch (error) {
      toast.error("Failed to add payment method");
      console.error(error);
    }
  };

  const isMobilePaymentSelected = selectedPaymentMethod && 
    ['bkash', 'nagad'].includes(selectedPaymentMethod.type.toLowerCase());

  // Get item identifier for cart operations (same as cart page)
  const getItemIdentifier = (item) => {
    return isLoggedIn ? item._id : item.guestItemId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Checkout
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Complete your purchase securely
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Shipping & Payment */}
          <div className="flex-1 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-blue-500 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Shipping Information</h3>
                </div>
              </div>
              
              <div className="p-6">
                {address && (
                  <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSavedAddress}
                        onChange={(e) => {
                          setUseSavedAddress(e.target.checked);
                          if (e.target.checked) {
                            setShippingInfo({
                              fullName: user?.fullName || "",
                              address: address.street || "",
                              city: address.city || "",
                              postalCode: address.zipCode || "",
                              state: address.state || "",
                              country: address.country || "",
                              phone: user?.phoneNumber || "",
                            });
                          }
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">Use my saved address</span>
                    </label>
                  </div>
                )}

                {useSavedAddress && address ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="text-green-500 text-xl mt-1" />
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-900">{user?.fullName}</p>
                        <p className="text-gray-700">{address.street}</p>
                        <p className="text-gray-700">{address.city}, {address.state} {address.zipCode}</p>
                        <p className="text-gray-700">{address.country}</p>
                        <p className="text-blue-600 font-medium">{user?.phoneNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseSavedAddress(false)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      Use a different address
                    </button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline mr-2 text-gray-400" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={shippingInfo.fullName || ""}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaPhone className="inline mr-2 text-gray-400" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingInfo.phone || ""}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaHome className="inline mr-2 text-gray-400" />
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={shippingInfo.address || ""}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={shippingInfo.city || ""}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={shippingInfo.state || ""}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={shippingInfo.postalCode || ""}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaGlobe className="inline mr-2 text-gray-400" />
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={shippingInfo.country || ""}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        if (!validateShippingInfo()) return;
                        await updateAddress({
                          street: shippingInfo.address,
                          city: shippingInfo.city,
                          zipCode: shippingInfo.postalCode,
                          state: shippingInfo.state,
                          country: shippingInfo.country
                        });
                        setUseSavedAddress(true);
                        toast.success("Address saved successfully!");
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold transform hover:scale-105"
                    >
                      Save Address
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FaTruck className="text-green-500 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Shipping Method</h3>
                </div>
              </div>
              
              <div className="p-6">
                {shippingOptions.length === 0 ? (
                  <div className="text-center py-8">
                    <FaTruck className="text-gray-400 text-4xl mx-auto mb-4" />
                    <p className="text-gray-500">No shipping options available.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((opt, idx) => (
                      <label key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer">
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={selectedShipping?.name === opt.name}
                          onChange={() => setSelectedShipping(opt)}
                          className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-semibold text-gray-900">{opt.name}</span>
                            <p className="text-sm text-gray-500">{opt.estimatedDays} days delivery</p>
                          </div>
                                                     <span className="font-bold text-green-600">BDT{Number(opt.charge).toFixed(2)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FaCreditCard className="text-purple-500 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                </div>
              </div>

              <div className="p-6">
                {!addingNewPayment ? (
                  <div className="space-y-4">
                    <select
                      value={selectedPaymentMethod?._id || ""}
                      onChange={(e) => {
                        const methodId = e.target.value;
                        const method = paymentMethods.find(m => m._id === methodId) || 
                          { _id: "cash", type: "cash", label: "Cash on Delivery" };
                        setSelectedPaymentMethod(method);
                      }}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select a payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method._id} value={method._id}>
                          {method.label || `${method.type.toUpperCase()} ${method.walletNumberMasked || method.last4 || ''}`}
                        </option>
                      ))}
                      <option value="Cash On Delivery">Cash on Delivery</option>
                    </select>

                    {selectedPaymentMethod && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        {renderPaymentIcon(selectedPaymentMethod.type)}
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {selectedPaymentMethod.label ||
                              (selectedPaymentMethod.type === 'cash'
                                ? 'Cash on Delivery'
                                : `${selectedPaymentMethod.type.toUpperCase()} ${selectedPaymentMethod.walletNumberMasked || selectedPaymentMethod.last4 || ''}`)}
                          </span>
                          {selectedPaymentMethod.type !== 'cash' && selectedPaymentMethod.walletNumberMasked && (
                            <span className="text-sm text-gray-500">
                              Wallet: {selectedPaymentMethod.walletNumberMasked}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setAddingNewPayment(true)}
                      className="flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                    >
                      <FaPlus className="mr-2" /> Add new payment method
                    </button>

                    {/* Mobile payment transaction details */}
                    {isMobilePaymentSelected && (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-4">
                        <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                          <FaMobileAlt className="text-yellow-600" />
                          Payment Instructions
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Mobile Number</label>
                            <input
                              type="text"
                              value={selectedPaymentMethod.msisdn || selectedPaymentMethod.walletNumberMasked}
                              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Send Money To</label>
                            <input
                              type="text"
                              value={"+8801873886367"}
                              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 font-mono"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Number (TRX ID)*</label>
                            <input
                              type="text"
                              value={transactionNumber}
                              onChange={(e) => setTransactionNumber(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              required
                              placeholder="Enter your bKash/Nagad transaction ID"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Please complete the payment first and then enter the transaction ID here.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900">Add New Payment Method</h4>
                      <button 
                        onClick={() => setAddingNewPayment(false)}
                        className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {['bkash', 'nagad', 'card'].map(type => (
                        <button
                          key={type}
                          onClick={() => setNewPaymentMethod(prev => ({ ...prev, type }))}
                          className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all duration-200 ${
                            newPaymentMethod.type === type 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {renderPaymentIcon(type)}
                          <span className="mt-2 text-sm font-medium">
                            {type === 'bkash' ? 'bKash' : 
                             type === 'nagad' ? 'Nagad' : 'Card'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {newPaymentMethod.type === 'card' ? 'Card Number' : 'Wallet Number'}
                      </label>
                      <input
                        type="text"
                        name="walletNumberMasked"
                        value={newPaymentMethod.walletNumberMasked}
                        onChange={handleNewPaymentChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={
                          newPaymentMethod.type === 'card' 
                            ? '1234 5678 9012 3456' 
                            : '01XXXXXXXXX'
                        }
                      />
                    </div>

                    {newPaymentMethod.type !== 'card' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (optional)
                        </label>
                        <input
                          type="text"
                          name="msisdn"
                          value={newPaymentMethod.msisdn}
                          onChange={handleNewPaymentChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nickname (optional)
                      </label>
                      <input
                        type="text"
                        name="label"
                        value={newPaymentMethod.label}
                        onChange={handleNewPaymentChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., My bKash, Personal Card"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="defaultPayment"
                        name="isDefault"
                        checked={newPaymentMethod.isDefault}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="defaultPayment" className="ml-2 text-sm text-gray-700">
                        Set as default payment method
                      </label>
                    </div>

                    <button
                      onClick={handleAddPaymentMethod}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold transform hover:scale-105"
                    >
                      Save Payment Method
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full lg:w-96">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <FaShieldAlt className="text-green-500" />
                Order Summary
              </h3>
              
              {/* Cart Items */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-6">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex items-start gap-4 pb-4 border-b border-gray-100">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img 
                          src={item.mainImage} 
                          alt={item.name} 
                          className="w-full h-full object-contain p-1" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                        {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                        {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end">
                                                 <span className="font-bold text-gray-900">BDT{(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          onClick={() => removeItem(getItemIdentifier(item))}
                          className="text-red-500 hover:text-red-700 mt-1 transition-colors duration-200"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FaShoppingBag className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>Your cart is empty</p>
                  </div>
                )}
              </div>

              {/* Order Totals */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                                     <span className="font-semibold text-gray-900">BDT{mainTotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Discount</span>
                                             <span className="font-semibold">- BDT{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-600">
                      <span>Discount Percentage</span>
                      <span className="font-semibold">{discountPercentage.toFixed(2)}%</span>
                    </div>
                  </>
                )}
                
                {coupon?.code && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Coupon Applied</span>
                    <span className="font-semibold">{coupon.code}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                                     <span className="font-semibold text-gray-900">BDT{shippingCharge.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xl font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                                     <span className="text-green-600">BDT{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FaLock className="text-green-600" />
                  <span className="font-semibold text-green-800">Secure Checkout</span>
                </div>
                <p className="text-sm text-green-700">
                  Your payment information is encrypted and secure. We never store your payment details.
                </p>
              </div>

              {/* Checkout Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                  className={`w-full px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 ${
                    loading ? "bg-gray-400 cursor-not-allowed" : 
                    "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 shadow-lg"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
                
                <button
                  onClick={() => navigate("/cart")}
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                >
                  <FaArrowLeft />
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;