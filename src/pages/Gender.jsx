import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const GenderManagement = () => {
  const [genders, setGenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState('');
  const [editingGender, setEditingGender] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenders();
  }, []);

  const fetchGenders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/genders`);
      setGenders(response.data);
    } catch (error) {
      console.error('Error fetching genders:', error);
    }
    setLoading(false);
  };

  const handleAddGender = async () => {
    try {
      const newGender = { type };
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/genders`, newGender);
      setGenders([...genders, response.data]);
      setType('');
    } catch (error) {
      console.error('Error adding gender:', error);
    }
  };

  const handleUpdateGender = async () => {
    try {
      const updatedGender = { type };
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/genders/${editingGender._id}`, updatedGender);
      setGenders(genders.map(gender => (gender._id === editingGender._id ? response.data : gender)));
      setType('');
      setEditingGender(null);
    } catch (error) {
      console.error('Error updating gender:', error);
    }
  };

  const handleDeleteGender = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/genders/${id}`);
      setGenders(genders.filter(gender => gender._id !== id));
    } catch (error) {
      console.error('Error deleting gender:', error);
    }
  };

  const startEditing = (gender) => {
    setType(gender.type);
    setEditingGender(gender);
  };

  const filteredGenders = genders.filter((gender) => {
    const query = searchQuery.toLowerCase();
    return gender.type.toLowerCase().includes(query);
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
          <h1 className="text-3xl sm:text-4xl font-bold">Gender Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search genders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (editingGender) handleUpdateGender();
            else handleAddGender();
          }}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingGender ? 'Update Gender' : 'Add Gender'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{editingGender ? 'Edit Gender' : 'Add New Gender'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Gender Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded"
              required
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Type</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="text-center py-4">
                    Loading genders...
                  </td>
                </tr>
              ) : filteredGenders.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-4">
                    No genders found.
                  </td>
                </tr>
              ) : (
                filteredGenders.map((gender) => (
                  <tr key={gender._id} className="text-center">
                    <td className="py-2 px-4 border-b">{gender.type}</td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button
                        className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => startEditing(gender)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteGender(gender._id)}
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
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

export default GenderManagement;
