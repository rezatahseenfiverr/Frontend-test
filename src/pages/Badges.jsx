import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaTag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BadgeManagement = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [editingBadge, setEditingBadge] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/badges`);
      setBadges(response.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
    setLoading(false);
  };

  const handleAddBadge = async () => {
    try {
      const newBadge = { name, color };
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/badges`, newBadge);
      setBadges([...badges, response.data]);
      setName('');
      setColor('');
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  };

  const handleUpdateBadge = async () => {
    try {
      const updatedBadge = { name, color };
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/badges/${editingBadge._id}`, updatedBadge);
      setBadges(badges.map(badge => (badge._id === editingBadge._id ? response.data : badge)));
      setName('');
      setColor('');
      setEditingBadge(null);
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  };

  const handleDeleteBadge = async (id) => {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URI}/api/badges/${id}`);
        setBadges(badges.filter(badge => badge._id !== id));
      } catch (error) {
        console.error('Error deleting badge:', error);
      }
    }
  };

  const startEditing = (badge) => {
    setName(badge.name);
    setColor(badge.color);
    setEditingBadge(badge);
  };

  const filteredBadges = badges.filter((badge) => {
    const query = searchQuery.toLowerCase();
    return (
      badge.name.toLowerCase().includes(query) || badge.color.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">Badge Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (editingBadge) handleUpdateBadge();
            else handleAddBadge();
          }}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingBadge ? 'Update Badge' : 'Add Badge'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaTag className="mr-2 text-blue-500" />
            {editingBadge ? 'Edit Badge' : 'Add New Badge'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge Name</label>
              <input
                type="text"
                placeholder="Enter badge name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color (Hex)</label>
              <input
                type="text"
                placeholder="#FF0000"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Color</th>
                <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading badges...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBadges.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No badges found matching your search.' : 'No badges found.'}
                  </td>
                </tr>
              ) : (
                filteredBadges.map((badge) => (
                  <tr key={badge._id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4 font-medium text-gray-800">{badge.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: badge.color }}
                        />
                        <span className="text-gray-600">{badge.color}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="flex items-center bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                          onClick={() => startEditing(badge)}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          onClick={() => handleDeleteBadge(badge._id)}
                        >
                          <FaTrash className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BadgeManagement;
