import React from 'react';
import { 
  FaBarcode, 
  FaSearch, 
  FaTrash, 
  FaCreditCard, 
  FaMoneyBillWave,
  FaMobileAlt,
  FaUniversity,
  FaCalculator,
  FaCamera,
  FaBox,
  FaUser,
  FaReceipt,
  FaCheck,
  FaArrowLeft,
  FaShoppingCart,
  FaCashRegister
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../context/POSContext';
import QRScanner from '../components/QRScanner';

const AdminPOS = () => {
  const navigate = useNavigate();
  const {
    // State
    cart,
    customer,
    searchQuery,
    scannedBarcode,
    searchResults,
    loading,
    showScanner,
    stats,
    paymentMethod,
    taxRate,
    discount,
    notes,
    outlet,
    searchInputRef,
    barcodeInputRef,
    
    // Actions
    setCustomer,
    setSearchQuery,
    setScannedBarcode,
    setShowScanner,
    setPaymentMethod,
    setTaxRate,
    setDiscount,
    setNotes,
    setOutlet,
    
    // Functions
    searchProducts,
    scanBarcode,
    handleQRScan,
    addToCart,
    removeFromCart,
    clearCart,
    calculateTotals,
    processOrder
  } = usePOS();

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center text-gray-700 hover:text-gray-900 transition"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">Point of Sale</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Cashier</p>
            <p className="font-medium">Admin</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Outlet</p>
            <p className="font-medium">{outlet}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full max-w-7xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">${stats.todaySales?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaReceipt className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completedOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaCheck className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cart Items</p>
                <p className="text-2xl font-bold text-orange-600">{cart.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaShoppingCart className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Product Search and Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Barcode Section */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaSearch className="mr-2 text-blue-500" />
                Product Search & Barcode Scanner
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barcode Scanner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Scanner</label>
                  <div className="flex space-x-2">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Scan barcode..."
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && scanBarcode(scannedBarcode)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    <button
                      onClick={() => scanBarcode(scannedBarcode)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FaBarcode size={16} />
                    </button>
                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FaCamera size={16} />
                    </button>
                  </div>
                </div>

                {/* Product Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Search</label>
                  <div className="flex space-x-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchProducts(e.target.value);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    <button
                      onClick={() => searchProducts(searchQuery)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <FaSearch size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => addToCart(item)}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.productId.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.size} • {item.color?.name} • ${item.price}
                          </p>
                          <p className="text-xs text-gray-500">Available: {item.availableQuantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${item.discountPrice || item.price}</p>
                          <div className="bg-white p-1 border rounded mt-1">
                            <img 
                              src={`https://barcodeapi.org/api/auto/${item.barcode}`}
                              alt={`Barcode ${item.barcode}`}
                              className="h-6 w-auto"
                              title={item.barcode}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center">
                    <FaShoppingCart className="mr-2 text-blue-500" />
                    Cart ({cart.length} items)
                  </h2>
                  <button
                    onClick={clearCart}
                    className="px-3 py-1 text-red-600 hover:text-red-800 flex items-center"
                  >
                    <FaTrash size={16} className="mr-1" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <FaBox size={48} className="mx-auto mb-4" />
                      <p>Cart is empty</p>
                      <p className="text-sm">Scan barcode or search products to add items</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.inventoryId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">
                              {item.variantInfo.size} • {item.variantInfo.color}
                            </p>
                            <p className="text-xs text-gray-500">{item.variantInfo.barcode}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">${item.unitPrice} each</p>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Barcode</div>
                              <div className="bg-white p-1 border rounded">
                                <img 
                                  src={`https://barcodeapi.org/api/auto/${item.variantInfo.barcode}`}
                                  alt={`Barcode ${item.variantInfo.barcode}`}
                                  className="h-8 w-auto"
                                  title={item.variantInfo.barcode}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.inventoryId)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Customer Info and Payment */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    placeholder="Address"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaCreditCard className="mr-2 text-blue-500" />
                Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: FaMoneyBillWave },
                  { value: 'card', label: 'Card', icon: FaCreditCard },
                  { value: 'mobile_payment', label: 'Mobile', icon: FaMobileAlt },
                  { value: 'bank_transfer', label: 'Bank', icon: FaUniversity }
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-1 ${
                      paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <method.icon size={20} />
                    <span className="text-sm">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FaCalculator className="mr-2 text-blue-500" />
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Tax (%):</span>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                  />
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Discount (%):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                  />
                  <span>${discountAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
                <textarea
                  placeholder="Order Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              <button
                onClick={processOrder}
                disabled={loading || cart.length === 0}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCashRegister className="mr-2" />
                    Complete Sale - ${total.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onScan={handleQRScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
};

export default AdminPOS;
