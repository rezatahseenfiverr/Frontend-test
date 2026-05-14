import React, { useState, useEffect, useContext } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FaDollarSign, FaShoppingCart, FaUsers, FaBoxes, 
  FaExclamationTriangle, FaBell, FaChartLine, FaTruck,
  FaEye, FaEyeSlash, FaRedo, FaCalendarAlt, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const MainContent = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // API base URL
  const API_URI = import.meta.env.VITE_API_URI || "http://localhost:5000";

  // Helper function to get admin token
  const getAdminToken = () => {
    return localStorage.getItem("adminAccessToken") || 
           localStorage.getItem("adminToken") || 
           localStorage.getItem("adminRefreshToken") || 
           localStorage.getItem("accessToken");
  };

  // Format currency
  const formatCurrency = (amount, currency = 'BDT') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await axios.get(`${API_URI}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboardData(response.data.stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time updates
  const fetchRealTimeData = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await axios.get(`${API_URI}/api/dashboard/realtime`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRealTimeData(response.data.realTimeData);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const newSocket = io(API_URI, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Dashboard socket connected');
      setIsConnected(true);
      newSocket.emit('joinAdminRoom');
      newSocket.emit('joinDashboard');
    });

    newSocket.on('disconnect', () => {
      console.log('Dashboard socket disconnected');
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('newOrder', (order) => {
      toast.info(`New order received: #${order.orderNumber}`);
      fetchRealTimeData();
    });

    newSocket.on('orderStatusUpdate', (data) => {
      toast.info(`Order #${data.orderNumber} status updated to ${data.status}`);
      fetchRealTimeData();
    });

    newSocket.on('lowStockAlert', (item) => {
      toast.warning(`Low stock alert: ${item.productId?.name || 'Product'} (${item.availableQuantity} left)`);
      fetchRealTimeData();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchRealTimeData();

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Chart colors
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  if (loading) {
    return (
      <div className="p-4 sm:ml-64">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 sm:ml-64">
        <div className="text-center text-gray-500">
          <p>Failed to load dashboard data</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:ml-64">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              onClick={() => {
                fetchDashboardData();
                fetchRealTimeData();
                toast.success('Dashboard refreshed');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
                              <FaRedo className="text-sm" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {formatTime(lastUpdate)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Sales */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.today.sales)}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData.today.orders} orders
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaDollarSign className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.week.sales)}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData.week.orders} orders
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaChartLine className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.users.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                +{dashboardData.users.newToday} today
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.inventory.totalItems.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData.inventory.lowStock} low stock
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <FaBoxes className="text-indigo-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardData.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke={chartColors.primary} 
                fill={chartColors.primary} 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.orderStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {dashboardData.orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.keys(chartColors).length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              Alerts
            </h3>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showAlerts ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {showAlerts && (
            <div className="space-y-3">
              {realTimeData?.lowStockAlerts?.length > 0 ? (
                realTimeData.lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <FaExclamationTriangle className="text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {item.productId?.name || 'Product'}
                      </p>
                      <p className="text-xs text-red-600">
                        Only {item.availableQuantity} left in stock
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No alerts at the moment</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaShoppingCart className="text-blue-500 mr-2" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {realTimeData?.latestOrders?.length > 0 ? (
              realTimeData.latestOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id?.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {order.userId?.firstName || order.cashier?.firstName || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.grandTotal || order.total)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent orders</p>
            )}
          </div>
        </div>

        {/* Unread Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBell className="text-purple-500 mr-2" />
            Unread Messages
          </h3>
          <div className="space-y-3">
            {realTimeData?.unreadContacts?.length > 0 ? (
              realTimeData.unreadContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      {contact.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-purple-600 truncate max-w-32">
                      {contact.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-600">
                      {formatTime(contact.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No unread messages</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.product?.name || 'Unknown Product'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.totalQuantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(product.totalRevenue)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI SEO Management */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI SEO</h3>
            <p className="text-sm text-gray-500">Auto-generates meta titles, descriptions, and keywords for every product</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const token = getAdminToken();
                  if (!token) { toast.error('Not authenticated'); return; }
                  const res = await axios.post(`${API_URI}/api/seo/generate`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success(`✅ Generated SEO for ${res.data.count} products`);
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed');
                }
              }}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
            >
              Generate Pending
            </button>
            <button
              onClick={async () => {
                if (!confirm('Force-regenerate SEO for ALL products? This will use AI credits.')) return;
                try {
                  const token = getAdminToken();
                  if (!token) { toast.error('Not authenticated'); return; }
                  const res = await axios.post(`${API_URI}/api/seo/force`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success(`✅ Force-regenerated SEO for ${res.data.count} products`);
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed');
                }
              }}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              Force All
            </button>
          </div>
        </div>
        <SeoStats tokenFn={getAdminToken} API_URI={API_URI} />
      </div>

      {/* AI Embeddings Management */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Embeddings</h3>
            <p className="text-sm text-gray-500">Vector search powers smarter product recommendations</p>
          </div>
          <button
            onClick={async () => {
              try {
                const token = getAdminToken();
                if (!token) { toast.error('Not authenticated'); return; }
                const res = await axios.post(`${API_URI}/api/embeddings/generate`, {}, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(`✅ Generated ${res.data.count} embeddings`);
              } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to generate');
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition"
          >
            Generate All
          </button>
        </div>
        <EmbeddingStats />
      </div>
    </div>
  );
};

const EmbeddingStats = () => {
  const [stats, setStats] = useState(null);
  const API_URI = import.meta.env.VITE_API_URI || "http://localhost:5000";
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("adminAccessToken") || localStorage.getItem("adminToken") || localStorage.getItem("adminRefreshToken") || localStorage.getItem("accessToken");
        if (!token) return;
        const res = await axios.get(`${API_URI}/api/embeddings/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {}
    })();
  }, []);
  if (!stats) return <div className="text-sm text-gray-400">Loading stats...</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
        <div className="text-xs text-gray-500">Total Products</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.withEmbedding}</div>
        <div className="text-xs text-gray-500">Embedded</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.pending || 0}</div>
        <div className="text-xs text-gray-500">Pending</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className={`text-2xl font-bold ${stats.available ? "text-green-600" : "text-red-500"}`}>
          {stats.available ? "✓" : "✗"}
        </div>
        <div className="text-xs text-gray-500">API Key</div>
      </div>
    </div>
  );
};

const SeoStats = ({ tokenFn, API_URI }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const token = tokenFn();
        if (!token) return;
        const res = await axios.get(`${API_URI}/api/seo/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {}
    })();
  }, []);
  if (!stats) return <div className="text-sm text-gray-400">Loading SEO stats...</div>;
  return (
    <div className="grid grid-cols-3 gap-4 mt-2">
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
        <div className="text-xs text-gray-500">Total Products</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.withSEO}</div>
        <div className="text-xs text-gray-500">With SEO</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.pending || 0}</div>
        <div className="text-xs text-gray-500">Pending</div>
      </div>
    </div>
  );
};

export default MainContent;
