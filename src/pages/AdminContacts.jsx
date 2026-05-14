import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEnvelope, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaTrash, 
  FaEdit,
  FaCheck,
  FaTimes,
  FaDownload,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
  FaUser,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const navigate = useNavigate();

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/contact/admin/contacts?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch contacts');
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/contact/admin/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [pagination.page, filters]);

  // Handle status update
  const handleStatusUpdate = async (contactId, status, priority, adminNotes) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URI}/api/contact/admin/contacts/${contactId}`,
        { status, priority, adminNotes },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      toast.success('Contact updated successfully');
      fetchContacts();
      fetchStats();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to update contact');
      console.error('Error updating contact:', error);
    }
  };

  // Handle delete
  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/contact/admin/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      toast.success('Contact deleted successfully');
      fetchContacts();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete contact');
      console.error('Error deleting contact:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-blue-600" />;
      case 'in-progress':
        return <FaExclamationTriangle className="text-blue-600" />;
      case 'resolved':
        return <FaCheckCircle className="text-green-600" />;
      case 'closed':
        return <FaBan className="text-gray-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      {/* Header */}
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Messages</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full max-w-5xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaEnvelope className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{stats.byStatus?.pending || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaClock className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.byStatus?.resolved || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-5xl mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaFilter className="mr-2 text-blue-500" />
            Filter Contacts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: '', priority: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="w-full max-w-5xl">
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <FaEnvelope className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">No contacts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Contact</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Subject</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Priority</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-gray-50 border-b">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <div>
                          <div className="font-semibold">{contact.name}</div>
                          <div className="text-sm text-gray-600">{contact.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{contact.subject}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
                          {getStatusIcon(contact.status)}
                          <span className="ml-1">{contact.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(contact.priority)}`}>
                          {contact.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{new Date(contact.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowModal(true);
                            }}
                            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                          >
                            <FaEye className="mr-1" /> View
                          </button>
                          <button
                            onClick={() => handleDelete(contact._id)}
                            className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          >
                            <FaTrash className="mr-1" /> Delete
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
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedContact.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-gray-900">{selectedContact.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedContact.status}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedContact.priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this contact..."
                  defaultValue={selectedContact.adminNotes || ''}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const status = document.getElementById('status').value;
                    const priority = document.getElementById('priority').value;
                    const adminNotes = document.getElementById('adminNotes').value;
                    handleStatusUpdate(selectedContact._id, status, priority, adminNotes);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Update Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
