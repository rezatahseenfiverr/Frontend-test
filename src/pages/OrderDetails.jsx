import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { 
  FaBox, 
  FaTruck, 
  FaCheckCircle, 
  FaClock, 
  FaBan,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCreditCard,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaTrash,
  FaExclamationTriangle,
  FaPrint,
  FaDownload,
  FaShare,
  FaEye,
  FaTimes,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';

function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const socketRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URI;
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URI || API_BASE;

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

  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status step for progress bar
  const getStatusStep = (status) => {
    const statusSteps = {
      'pending': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': 0,
      'canceled': 0
    };
    return statusSteps[status?.toLowerCase()] || 0;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-blue-600 bg-blue-50 border-blue-200',
      'processing': 'text-blue-600 bg-blue-50 border-blue-200',
      'shipped': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'delivered': 'text-green-600 bg-green-50 border-green-200',
      'cancelled': 'text-red-600 bg-red-50 border-red-200',
      'canceled': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FaClock className="text-blue-600" />;
      case 'processing':
        return <FaBox className="text-blue-600" />;
      case 'shipped':
        return <FaTruck className="text-indigo-600" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'cancelled':
      case 'canceled':
        return <FaBan className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setOrder(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
        if (err.response?.status === 404) {
          toast.error('Order not found');
          navigate('/profile/orders');
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, API_BASE, navigate]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const accessToken = localStorage.getItem('accessToken');
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token: accessToken || '' },
    });

    // Join user-specific room
    socketRef.current.emit('joinUserRoom', user._id);

    socketRef.current.on('connect', () => {
      console.log('Socket connected in OrderDetails');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected in OrderDetails');
    });

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      const { eventType, order: updatedOrder, updateType } = data;
      
      if (updatedOrder && updatedOrder.orderId === orderId) {
        setOrder(updatedOrder);
        
        switch (eventType || updateType) {
          case 'status_updated':
            toast.info(`Order #${orderId} status updated to ${updatedOrder.orderStatus}`);
            break;
          case 'product_added':
            toast.info(`Product added to order #${orderId}`);
            break;
          case 'product_removed':
            toast.info(`Product removed from order #${orderId}`);
            break;
          case 'quantity_updated':
            toast.info(`Quantity updated in order #${orderId}`);
            break;
          case 'discount_updated':
            toast.info(`Discount updated for order #${orderId}`);
            break;
          default:
            toast.info(`Order #${orderId} updated`);
        }
      }
    };

    socketRef.current.on(`user:orderUpdate:${user._id}`, handleOrderUpdate);
    socketRef.current.on('orderUpdated', handleOrderUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(`user:orderUpdate:${user._id}`, handleOrderUpdate);
        socketRef.current.off('orderUpdated', handleOrderUpdate);
        socketRef.current.disconnect();
      }
    };
  }, [user, SOCKET_URL, orderId]);

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelLoading(true);
      const response = await axios.patch(
        `${API_BASE}/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      setOrder(response.data.order);
      toast.success('Order cancelled successfully');
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  // Print order
  const handlePrint = () => {
    window.print();
  };

  // Share order
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order #${order?.orderId}`,
          text: `Check out my order #${order?.orderId}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Order link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/profile/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaArrowLeft />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Link
            to="/profile/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaArrowLeft />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.orderStatus);
  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/profile/orders"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.orderId}
                </h1>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            
                         <div className="flex items-center gap-3">
               <button
                 onClick={handleShare}
                 className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                 title="Share Order"
               >
                 <FaShare className="text-lg" />
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                  {getStatusIcon(order.orderStatus)}
                  <span className="capitalize">{order.orderStatus}</span>
                </span>
              </div>

              {/* Progress Bar */}
              {order.orderStatus?.toLowerCase() !== 'cancelled' && order.orderStatus?.toLowerCase() !== 'canceled' && (
                <div className="relative">
                  {/* Desktop Horizontal Progress Bar */}
                  <div className="hidden md:block">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep >= 1 ? <FaCheck /> : '1'}
                        </div>
                        <span className={`text-sm font-medium ${
                          currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          Order Placed
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep >= 2 ? <FaCheck /> : '2'}
                        </div>
                        <span className={`text-sm font-medium ${
                          currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          Processing
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 3 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep >= 3 ? <FaCheck /> : '3'}
                        </div>
                        <span className={`text-sm font-medium ${
                          currentStep >= 3 ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          Shipped
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep >= 4 ? <FaCheck /> : '4'}
                        </div>
                        <span className={`text-sm font-medium ${
                          currentStep >= 4 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Delivered
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Line */}
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Mobile Vertical Progress Bar */}
                  <div className="md:hidden">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {currentStep >= 1 ? <FaCheck /> : '1'}
                          </div>
                          {currentStep < 4 && (
                            <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 ${
                              currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            Order Placed
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Your order has been received</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {currentStep >= 2 ? <FaCheck /> : '2'}
                          </div>
                          {currentStep < 4 && (
                            <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 ${
                              currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            Processing
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Your order is being prepared</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= 3 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {currentStep >= 3 ? <FaCheck /> : '3'}
                          </div>
                          {currentStep < 4 && (
                            <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 ${
                              currentStep >= 3 ? 'bg-indigo-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            currentStep >= 3 ? 'text-indigo-600' : 'text-gray-500'
                          }`}>
                            Shipped
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Your order is on its way</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {currentStep >= 4 ? <FaCheck /> : '4'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            currentStep >= 4 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            Delivered
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Your order has been delivered</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                
                {order.orderStatus !== 'pending' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Order Processing</p>
                      <p className="text-sm text-gray-600">Your order is being prepared</p>
                    </div>
                  </div>
                )}
                
                {['shipped', 'delivered'].includes(order.orderStatus?.toLowerCase()) && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Order Shipped</p>
                      <p className="text-sm text-gray-600">Your order is on its way</p>
                    </div>
                  </div>
                )}
                
                {order.orderStatus === 'delivered' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Order Delivered</p>
                      <p className="text-sm text-gray-600">Your order has been delivered</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        {item.color && <p>Color: {item.color}</p>}
                        {item.size && (
                          <p>
                            {item.measureType}: {item.size} {item.unitName || ''}
                          </p>
                        )}
                        <p>Quantity: {item.quantity}</p>
                        <p className="font-medium text-gray-900">
                          Price: {formatCurrency(item.price || 0)}
                        </p>
                        {item.discountApplied > 0 && (
                          <p className="text-green-600">
                            Discount: {formatCurrency(item.discountApplied)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency((item.price - (item.discountApplied || 0)) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            {order.shipping && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaTruck className="text-blue-500" />
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Shipping Method</p>
                    <p className="text-gray-900">{order.shipping.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                    <p className="text-gray-900">{order.shipping.estimatedDays} days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Shipping Cost</p>
                    <p className="text-gray-900">{formatCurrency(order.shipping.charge)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatCurrency(order.shippingCost || 0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-500" />
                Shipping Address
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-600">{order.shippingAddress?.address}</p>
                <p className="text-gray-600">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                </p>
                <p className="text-gray-600">{order.shippingAddress?.country}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <FaPhone className="text-sm" />
                  {order.shippingAddress?.phone}
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCreditCard className="text-blue-500" />
                Payment Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="text-gray-900">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'completed' ? 'text-green-600 bg-green-50 border-green-200' :
                    order.paymentStatus === 'pending' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                    'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.paymentDetails && Object.keys(order.paymentDetails).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Details</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {Object.entries(order.paymentDetails).map(([key, value]) => (
                        <p key={key}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {order.orderStatus?.toLowerCase() === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Cancel Order
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
