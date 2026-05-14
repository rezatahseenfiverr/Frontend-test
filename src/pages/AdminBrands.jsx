import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/brands`);
      setBrands(res.data);
    } catch { toast.error('Failed to load brands'); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Brand name is required'); return; }
    try {
      if (editing) {
        const res = await axios.put(`${import.meta.env.VITE_API_URI}/api/brands/${editing._id}`, { name: name.trim() });
        setBrands(brands.map(b => b._id === editing._id ? res.data : b));
        toast.success('Brand updated');
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URI}/api/brands`, { name: name.trim() });
        setBrands([...brands, res.data]);
        toast.success('Brand added');
      }
      setName('');
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/brands/${id}`);
      setBrands(brands.filter(b => b._id !== id));
      toast.success('Brand deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const startEdit = (brand) => { setName(brand.name); setEditing(brand); };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-700 hover:text-gray-900 transition"><FaArrowLeft className="text-2xl" /></button>
          <h1 className="text-3xl sm:text-4xl font-bold">Brand Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input type="text" placeholder="Search brands..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={handleSave} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4">
          <FaPlus className="mr-2" /> {editing ? 'Update Brand' : 'Add Brand'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{editing ? 'Edit Brand' : 'Add New Brand'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Brand Name" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border border-gray-300 bg-white rounded" required />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="2" className="text-center py-4">Loading brands...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="2" className="text-center py-4">No brands found.</td></tr>
              ) : (
                filtered.map((brand) => (
                  <tr key={brand._id} className="text-center">
                    <td className="py-2 px-4 border-b">{brand.name}</td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={() => startEdit(brand)}><FaEdit className="mr-1" /> Edit</button>
                      <button className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onClick={() => handleDelete(brand._id)}><FaTrash className="mr-1" /> Delete</button>
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

export default BrandManagement;
