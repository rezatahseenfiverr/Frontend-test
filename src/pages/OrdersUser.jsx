import React, { useEffect, useState, useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { 
  FaBox, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaEye, 
  FaTrash, 
  FaWifi, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaBan
} from 'react-icons/fa';

function OrdersListPage() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const API_BASE = import.meta.env.VITE_API_URI;
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URI || API_BASE;

  // Browser notification helper
  const showNotification = (message) => {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        new Notification('Order Update', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') new Notification('Order Update', { body: message });
        });
      }
    } catch (e) {
      // Fallback to toast
      toast.info(message);
    }
  };

  // Format currency utility
  const formatCurrency = (amount, currency = 'BDT', locale = 'en-BD') => {
    if (typeof amount !== 'number') return 'BDT0.00';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `BDT${amount.toFixed(2)}`;
    }
  };

  // Mask phone number utility
  const maskPhone = (num) => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    if (digits.length < 7) return num.replace(/\d/g, '*');
    const masked = `${digits.slice(0, 4)}${'*'.repeat(Math.max(0, digits.length - 7))}${digits.slice(-3)}`;
    return num.startsWith('+') ? `+${masked}` : masked;
  };

  // Build payment details utility
  const buildPaymentDetails = (order) => {
    if (!order?.paymentDetails) return [];
    const method = (order.paymentMethod || '').toLowerCase();
    const pd = order.paymentDetails;

    const walletMasked = pd.walletNumberMasked || 
      (pd.mobileNumber ? maskPhone(pd.mobileNumber) : null);

    const details = [];
    if (walletMasked) {
      details.push({ label: 'Wallet', value: walletMasked });
    }

    if (['bkash', 'nagad', 'rocket', 'upay'].includes(method)) {
      if (pd.transactionNumber) {
        details.push({ label: 'TRX ID', value: pd.transactionNumber });
      }
    }

    const shownKeys = new Set(['walletNumberMasked', 'mobileNumber', 'transactionNumber']);
    Object.entries(pd).forEach(([k, v]) => {
      if (v == null || v === '' || shownKeys.has(k)) return;
      const label = k
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase());
      details.push({ label, value: String(v) });
    });

    return details;
  };

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const accessToken = localStorage.getItem('accessToken');
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token: accessToken || '' },
    });

    // Join user-specific room
    newSocket.emit('joinUserRoom', user._id);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus('error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, SOCKET_URL]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data) => {
      const { eventType, order, updateType } = data;
      
      switch (eventType || updateType) {
        case 'create':
        case 'order_created':
          setOrders(prevOrders => [order, ...prevOrders]);
          showNotification(`New order placed: #${order.orderId}`);
          toast.success(`Order #${order.orderId} placed successfully!`);
          break;
        case 'update':
        case 'order_updated':
        case 'status_updated':
        case 'product_added':
        case 'product_removed':
        case 'quantity_updated':
        case 'discount_updated':
          setOrders(prevOrders => prevOrders.map(o => o._id === order._id ? order : o));
          toast.info(`Order #${order.orderId} updated`);
          showNotification(`Order #${order.orderId} updated`);
          break;
        case 'cancel':
        case 'order_cancelled':
          setOrders(prevOrders => prevOrders.map(o => o._id === order._id ? order : o));
          toast.warn(`Order #${order.orderId} cancelled`);
          showNotification(`Order #${order.orderId} cancelled`);
          break;
        case 'delivered':
        case 'order_delivered':
          setOrders(prevOrders => prevOrders.map(o => o._id === order._id ? order : o));
          toast.success(`Order #${order.orderId} delivered!`);
          showNotification(`Order #${order.orderId} delivered!`);
          break;
        default:
          console.warn('Unknown order update type:', eventType || updateType);
      }
    };

    // Listen to user-specific order updates
    socket.on(`user:orderUpdate:${user._id}`, handleOrderUpdate);
    socket.on(`orderUpdated`, handleOrderUpdate);

    return () => {
      socket.off(`user:orderUpdate:${user._id}`, handleOrderUpdate);
      socket.off(`orderUpdated`, handleOrderUpdate);
    };
  }, [socket, user?._id]);

  // Fetch orders effect
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to view your orders.');
      setLoading(false);
      return;
    }
    if (!API_BASE) {
      setError('Missing API base URL configuration.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/orders`, {
          params: { userId: user._id },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          list.sort((a, b) => {
            const ta = new Date(a?.createdAt || 0).getTime();
            const tb = new Date(b?.createdAt || 0).getTime();
            return tb - ta;
          });
          setOrders(list);
          setFilteredOrders(list);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load orders');
          if (socket) {
            socket.emit('error', {
              userId: user._id,
              error: err.message,
              component: 'OrdersListPage'
            });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [user, API_BASE, socket]);

  // Filter orders effect
  useEffect(() => {
    let result = [...orders];

    // Apply search term filter (order ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderId?.toString().toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => 
        order.orderStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            return orderDate >= oneWeekAgo;
          case 'month':
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return orderDate >= oneMonthAgo;
          case 'year':
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            return orderDate >= oneYearAgo;
          case 'custom':
            if (!startDate || !endDate) return true;
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include entire end day
            return orderDate >= start && orderDate <= end;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, dateFilter, startDate, endDate]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancelLoadingId(orderId);
      setCancelError('');

      const res = await axios.patch(
        `${API_BASE}/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          },
        }
      );

      // Success notification with custom styling
      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      
      // Optimistically update the order status
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: 'canceled' } 
            : order
        )
      );
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to cancel order';
      setCancelError(errorMessage);
      
      // Error notification with custom styling
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } finally {
      setCancelLoadingId(null);
    }
  };

  // Status color utility
  const getStatusColor = (status, colorMap) => {
    if (!status) return colorMap.default;
    return colorMap[status.toLowerCase()] || colorMap.default;
  };

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    processing: 'text-blue-600 bg-blue-50 border-blue-200',
    shipped: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    delivered: 'text-green-600 bg-green-50 border-green-200',
    canceled: 'text-red-600 bg-red-50 border-red-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200',
    default: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const paymentColors = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    completed: 'text-green-600 bg-green-50 border-green-200',
    failed: 'text-red-600 bg-red-50 border-red-200',
    refunded: 'text-purple-600 bg-purple-50 border-purple-200',
    default: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const connectionStatusColors = {
    connected: 'text-green-600 bg-green-50 border-green-200',
    disconnected: 'text-gray-600 bg-gray-50 border-gray-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    connecting: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  };

  const currency = useMemo(() => 'BDT', []);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'processing':
        return <FaBox className="text-blue-600" />;
      case 'shipped':
        return <FaTruck className="text-indigo-600" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'canceled':
      case 'cancelled':
        return <FaBan className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-red-600 text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBox className="text-gray-400 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 font-medium"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <FaBox className="text-white text-xl" />
              </div>
              My Orders
            </h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${connectionStatusColors[connectionStatus]}`}>
            {connectionStatus === 'connected' ? (
              <>
                <FaWifi />
                <span>Live updates connected</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                                 <FaTimes />
                <span>Live updates disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {cancelError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{cancelError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaSearch className="text-gray-400" />
              Search Order ID
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by order ID..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              Status
            </label>
            <select
              id="status"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              Date Range
            </label>
            <select
              id="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <FaTimes />
              Reset
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
          <FaBox className="text-gray-400" />
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSearch className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600 mb-6">No orders match your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDateFilter('all');
              setStartDate('');
              setEndDate('');
            }}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const paymentDetails = buildPaymentDetails(order);
            const createdAt = order?.createdAt 
              ? new Date(order.createdAt).toLocaleString() 
              : 'N/A';
            const total = order?.totalAmount || 0;
            const discount = order?.discountAmount || 0;

            return (
              <div
                key={order.orderId}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/profile/orders/${order.orderId}`}
                        className="text-xl font-bold text-gray-900 hover:text-yellow-600 transition-colors duration-200"
                      >
                        Order #{order.orderId}
                      </Link>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.orderStatus, statusColors)}`}>
                        {getStatusIcon(order.orderStatus)}
                        <span>{order.orderStatus || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      {createdAt}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FaCreditCard className="text-yellow-500" />
                        Payment Info
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus, paymentColors)}`}>
                            {order.paymentStatus || 'N/A'}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Method:</span>{' '}
                          <span className="text-gray-700">{(order.paymentMethod || 'N/A').toUpperCase()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-yellow-500" />
                        Shipping Address
                      </h4>
                      {order.shippingAddress ? (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{order.shippingAddress.fullName}</p>
                          <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                          <p className="text-gray-600">{order.shippingAddress.address}</p>
                          <p className="text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                          </p>
                          <p className="text-gray-600">{order.shippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No address provided</p>
                      )}
                      
                      {/* Shipping Method Information */}
                      {order.shipping && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <FaTruck className="text-blue-500" />
                            Shipping Method
                          </h5>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600">
                              <span className="font-medium">Method:</span> {order.shipping.name}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Cost:</span> {formatCurrency(order.shipping.charge, currency)}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Estimated Delivery:</span> {order.shipping.estimatedDays} days
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FaBox className="text-yellow-500" />
                        Order Summary
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Subtotal:</span>{' '}
                          <span className="text-gray-700">{formatCurrency(total + discount, currency)}</span>
                        </p>
                        {discount > 0 && (
                          <p className="text-sm">
                            <span className="font-medium">Discount:</span>{' '}
                            <span className="text-green-600 font-medium">-{formatCurrency(discount, currency)}</span>
                          </p>
                        )}
                        {order.shippingCost > 0 && (
                          <p className="text-sm">
                            <span className="font-medium">Shipping:</span>{' '}
                            <span className="text-blue-600 font-medium">{formatCurrency(order.shippingCost, currency)}</span>
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Total:</span>{' '}
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(order.grandTotal, currency)}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Items:</span>{' '}
                          <span className="text-gray-700">{order.items?.length || 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {paymentDetails.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FaCreditCard className="text-yellow-500" />
                        Payment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {paymentDetails.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 text-sm">
                              {detail.label}:
                            </span>
                            <span className="text-gray-900 text-sm">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {order.items?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaBox className="text-yellow-500" />
                        Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={item._id || index}
                            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                          >
                            <img
                              src={item.mainImage}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              loading="lazy"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <div className="text-sm text-gray-600 space-y-1 mt-1">
                                {item.color && <p>Color: {item.color}</p>}
                                {item.size && (
                                  <p>
                                    {item.measureType}: {item.size} {item.unitName || ''}
                                  </p>
                                )}
                                <p>Quantity: {item.quantity}</p>
                                <p className="font-medium text-gray-900">
                                  Price: {formatCurrency(item.price || 0, currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <Link
                        to={`/profile/orders/${order.orderId}`}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium flex items-center gap-2"
                      >
                        <FaEye />
                        View Details
                      </Link>
                      
                      {order.orderStatus?.toLowerCase() === 'pending' && (
                        <button
                          disabled={cancelLoadingId === order.orderId}
                          onClick={() => handleCancelOrder(order.orderId)}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                        >
                          {cancelLoadingId === order.orderId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <FaTrash />
                              Cancel Order
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrdersListPage;