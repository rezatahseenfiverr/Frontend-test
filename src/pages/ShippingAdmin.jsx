import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ShippingAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', charge: '', estimatedDays: 3, isActive: true });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URI;

  const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('adminToken') || localStorage.getItem('adminRefreshToken') || localStorage.getItem('accessToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/shipping`);
      setItems(res.data);
    } catch (error) {
      console.error('Error loading shipping types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/api/shipping/${editingId}`, form, { headers });
      } else {
        await axios.post(`${API}/api/shipping`, form, { headers });
      }
      setForm({ name: '', charge: '', estimatedDays: 3, isActive: true });
      setEditingId(null);
      load();
    } catch (error) {
      console.error('Error saving shipping type:', error);
    }
  };

  const edit = (it) => {
    setEditingId(it._id);
    setForm({ name: it.name, charge: it.charge, estimatedDays: it.estimatedDays, isActive: it.isActive });
  };

  const del = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipping type?')) {
      try {
        await axios.delete(`${API}/api/shipping/${id}`, { headers });
        load();
      } catch (error) {
        console.error('Error deleting shipping type:', error);
      }
    }
  };

  const toggleActive = async (it) => {
    try {
      await axios.put(`${API}/api/shipping/${it._id}`, { ...it, isActive: !it.isActive }, { headers });
      load();
    } catch (error) {
      console.error('Error toggling shipping type status:', error);
    }
  };

  const filtered = items.filter(it => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <h1 className="text-3xl sm:text-4xl font-bold">Shipping Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search shipping types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={submit}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingId ? 'Update Shipping' : 'Add Shipping'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaTruck className="mr-2 text-blue-500" />
            {editingId ? 'Edit Shipping Type' : 'Add New Shipping Type'}
          </h2>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Shipping name"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge (BDT)</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.charge} 
                onChange={e => setForm({...form, charge: Number(e.target.value)})} 
                placeholder="0.00"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.estimatedDays} 
                onChange={e => setForm({...form, estimatedDays: Number(e.target.value)})} 
                placeholder="3"
                min="1"
              />
            </div>
            <div className="flex items-center">
              <input 
                id="active" 
                type="checkbox" 
                checked={form.isActive} 
                onChange={e => setForm({...form, isActive: e.target.checked})} 
                className="mr-2"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Charge</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Estimated Days</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Status</th>
                <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading shipping types...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No shipping types found matching your search.' : 'No shipping types found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(it => (
                  <tr key={it._id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4 font-medium text-gray-800">{it.name}</td>
                    <td className="py-3 px-4">BDT{Number(it.charge).toFixed(2)}</td>
                    <td className="py-3 px-4">{it.estimatedDays} days</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(it)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                          it.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {it.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button 
                          className="flex items-center bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                          onClick={() => edit(it)}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button 
                          className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          onClick={() => del(it._id)}
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

export default ShippingAdmin;


