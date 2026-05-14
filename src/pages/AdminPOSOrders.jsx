import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaSearch, 
  FaEye, 
  FaPrint, 
  FaUndo, 
  FaFilter, 
  FaDownload,
  FaCalendarAlt,
  FaStore,
  FaUser,
  FaMoneyBillWave,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaArrowLeft,
  FaReceipt,
  FaHistory,
  FaClipboardList,
  FaTruck,
  FaBox,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const AdminPOSOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    outlet: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [refundData, setRefundData] = useState({
    refundAmount: 0,
    reason: ''
  });
  const [stats, setStats] = useState({});
  
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdmin();

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = (config) => {
    const token = localStorage.getItem('adminRefreshToken');
    return axios({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please log in as admin to access POS orders');
      navigate('/admin');
      return;
    }
    
    if (isAuthenticated) {
      fetchOrders();
      fetchStats();
    }
  }, [pagination.page, filters, isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await makeAuthenticatedRequest({
        method: 'GET',
        url: `http://localhost:3000/api/pos/orders?${params}`
      });
      setOrders(response.data.posOrders);
      setPagination({
        ...pagination,
        total: response.data.total,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await makeAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/pos/stats'
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const viewOrder = async (orderId) => {
    try {
      const response = await makeAuthenticatedRequest({
        method: 'GET',
        url: `http://localhost:3000/api/pos/orders/${orderId}`
      });
      setSelectedOrder(response.data.posOrder);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error fetching order details');
    }
  };

  const printReceipt = async (orderId) => {
    try {
      const response = await makeAuthenticatedRequest({
        method: 'GET',
        url: `http://localhost:3000/api/pos/orders/${orderId}/receipt`
      });
      const receipt = response.data.receipt;
      
      // Create thermal printer receipt with POS order barcode only
      const thermalReceiptContent = `
        <html>
          <head>
            <title>Receipt - ${receipt.orderNumber}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 9px; 
                margin: 0;
                padding: 2mm;
                width: 76mm;
                max-width: 76mm;
                background: white;
                line-height: 1.2;
                word-wrap: break-word;
              }
              .logo {
                text-align: center;
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 3mm;
                border-bottom: 1px dashed #000;
                padding-bottom: 2mm;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 3mm;
                font-size: 7px;
              }
              .customer-info {
                margin-bottom: 3mm;
                font-size: 7px;
              }
              .items-section {
                margin-bottom: 3mm;
              }
              .item {
                margin-bottom: 2mm;
                padding-bottom: 1mm;
                border-bottom: 1px dotted #ccc;
                font-size: 7px;
              }
              .item-details {
                margin: 0.5mm 0;
              }
              .order-barcode-section {
                text-align: center;
                margin: 3mm 0;
                padding: 2mm 0;
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
              }
              .barcode-container {
                text-align: center;
                margin: 1mm 0;
              }
              .barcode-image {
                max-width: 60mm;
                height: auto;
              }
              .totals {
                border-top: 1px dashed #000;
                padding-top: 2mm;
                margin-top: 3mm;
                font-size: 7px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin: 0.5mm 0;
              }
              .final-total {
                font-weight: bold;
                font-size: 9px;
                border-top: 1px solid #000;
                padding-top: 1mm;
                margin-top: 1mm;
              }
              .footer {
                text-align: center;
                margin-top: 3mm;
                border-top: 1px dashed #000;
                padding-top: 2mm;
                font-size: 7px;
              }
              .divider {
                text-align: center;
                margin: 2mm 0;
                font-size: 6px;
              }
              @media print {
                body {
                  width: 76mm;
                  max-width: 76mm;
                  margin: 0;
                  padding: 2mm;
                }
                .barcode-image {
                  max-width: 60mm;
                }
                * {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="logo">
              ╔══════════════════════════════════════════════════════════╗
              ║                                                          ║
              ║                    BARVELLA                             ║
              ║                                                          ║
              ╚══════════════════════════════════════════════════════════╝
            </div>
            
            <div class="receipt-header">
              <div>POS RECEIPT</div>
              <div>Order #: ${receipt.orderNumber}</div>
              <div>Date: ${new Date(receipt.date).toLocaleString()}</div>
              <div>Cashier: ${receipt.cashier.firstName} ${receipt.cashier.lastName}</div>
            </div>
            
            <div class="divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            
            <div class="customer-info">
              <div><strong>Customer:</strong> ${receipt.customer.name}</div>
              <div><strong>Phone:</strong> ${receipt.customer.phone || 'N/A'}</div>
            </div>
            
            <div class="divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            
            <div class="items-section">
              <div style="text-align: center; font-weight: bold; margin-bottom: 2mm;">ITEMS:</div>
              ${receipt.items.map(item => `
                <div class="item">
                  <div class="item-details">
                    <div><strong>${item.productName}</strong></div>
                    <div>Size: ${item.variantInfo.size}</div>
                    <div>${item.quantity} x $${item.unitPrice}</div>
                    ${item.discountPrice && item.discountPrice < item.unitPrice ? 
                      `<div style="color: #666; font-size: 6px;">Original: $${item.unitPrice} | Discounted: $${item.discountPrice}</div>` : 
                      ''
                    }
                    <div><strong>Total: $${item.totalPrice}</strong></div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="order-barcode-section">
              <div style="font-weight: bold; margin-bottom: 1mm;">ORDER BARCODE:</div>
              <div class="barcode-container">
                <img 
                  src="https://barcodeapi.org/api/auto/${receipt.orderNumber}" 
                  alt="Order Barcode ${receipt.orderNumber}"
                  class="barcode-image"
                  onerror="this.style.display='none'"
                  onload="this.style.display='block'"
                />
              </div>
              <div style="font-size: 6px; margin-top: 1mm; font-family: monospace;">${receipt.orderNumber}</div>
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${receipt.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>$${receipt.tax.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Discount:</span>
                <span>$${receipt.discount.toFixed(2)}</span>
              </div>
              <div class="total-row final-total">
                <span>TOTAL:</span>
                <span>$${receipt.total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Payment:</span>
                <span>${receipt.paymentMethod.toUpperCase()}</span>
              </div>
            </div>
            
            <div class="divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            
            <div class="footer">
              <div>Thank you for your purchase!</div>
              <div style="margin-top: 1mm;">Please come again</div>
              <div style="margin-top: 3mm; font-size: 6px;">
                ╔══════════════════════════════════════════════════════════╗
                ║                                                          ║
                ║                    BARVELLA                             ║
                ║                                                          ║
                ╚══════════════════════════════════════════════════════════╝
              </div>
            </div>
          </body>
        </html>
      `;
      
      // Open print dialog with thermal receipt
      const printWindow = window.open('', '_blank');
      printWindow.document.write(thermalReceiptContent);
      printWindow.document.close();
      printWindow.print();
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Error printing receipt');
    }
  };

  const refundOrder = async () => {
    if (!selectedOrder) return;

    try {
              await makeAuthenticatedRequest({
          method: 'POST',
          url: `http://localhost:3000/api/pos/orders/${selectedOrder._id}/refund`,
          data: refundData
        });
      toast.success('Order refunded successfully');
      setShowRefundModal(false);
      setRefundData({ refundAmount: 0, reason: '' });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error refunding order:', error);
      toast.error(error.response?.data?.message || 'Error refunding order');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await makeAuthenticatedRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/pos/orders/${orderId}`
      });
      toast.success('Order deleted successfully');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.message || 'Error deleting order');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await makeAuthenticatedRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/pos/orders/${orderId}/status`,
        data: { orderStatus: status }
      });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-blue-100 text-blue-800', icon: FaSpinner },
      processing: { color: 'bg-blue-100 text-blue-800', icon: FaSpinner },
      completed: { color: 'bg-green-100 text-green-800', icon: FaCheck },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaTimes },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: FaUndo }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: FaMoneyBillWave,
      card: FaCreditCard,
      mobile_payment: FaMobileAlt,
      bank_transfer: FaUniversity
    };
    const Icon = icons[method] || FaMoneyBillWave;
    return <Icon className="w-4 h-4" />;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

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
          <h1 className="text-3xl sm:text-4xl font-bold">POS Orders</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard/pos')}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FaReceipt className="mr-2" />
            New POS Order
          </button>
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
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockItems?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-7xl mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaFilter className="mr-2 text-blue-500" />
            Filter Orders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                             <input
                 type="text"
                 placeholder="Search orders..."
                 value={filters.search}
                 onChange={(e) => handleFilterChange('search', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select
                 value={filters.status}
                 onChange={(e) => handleFilterChange('status', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                             <input
                 type="text"
                 placeholder="Outlet"
                 value={filters.outlet}
                 onChange={(e) => handleFilterChange('outlet', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                             <input
                 type="date"
                 value={filters.dateFrom}
                 onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                             <input
                 type="date"
                 value={filters.dateTo}
                 onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ search: '', status: '', outlet: '', dateFrom: '', dateTo: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="w-full max-w-7xl">
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <FaBox className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Order</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Customer</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Items</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Total</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Payment</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 border-b">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{order.outlet}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                          <p className="text-sm text-gray-500">{order.customer.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900">{order.items.length} items</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <span className="ml-2 text-sm text-gray-900">
                            {order.paymentMethod.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.orderStatus)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => viewOrder(order._id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Order"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => printReceipt(order._id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Print Receipt"
                          >
                            <FaPrint size={16} />
                          </button>
                          {order.orderStatus === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setRefundData({ refundAmount: order.total, reason: '' });
                                setShowRefundModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Refund Order"
                            >
                              <FaUndo size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteOrder(order._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Order"
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination({ ...pagination, page })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order Details - {selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Customer Information</h4>
                  <p>Name: {selectedOrder.customer.name}</p>
                  <p>Phone: {selectedOrder.customer.phone || 'N/A'}</p>
                  <p>Email: {selectedOrder.customer.email || 'N/A'}</p>
                  <p>Address: {selectedOrder.customer.address || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Order Information</h4>
                  <p>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p>Cashier: {selectedOrder.cashier?.firstName} {selectedOrder.cashier?.lastName}</p>
                  <p>Outlet: {selectedOrder.outlet}</p>
                  <p>Payment: {selectedOrder.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.variantInfo.size} • {item.variantInfo.color} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>${selectedOrder.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => printReceipt(selectedOrder._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <FaPrint className="inline mr-2" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Refund Order</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Refund Amount</label>
                                 <input
                   type="number"
                   value={refundData.refundAmount}
                   onChange={(e) => setRefundData({ ...refundData, refundAmount: parseFloat(e.target.value) || 0 })}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                                 <textarea
                   value={refundData.reason}
                   onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                   rows={3}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                 />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={refundOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPOSOrders;
