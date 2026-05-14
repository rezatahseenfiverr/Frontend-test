import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ColorManagement = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [hexCode, setHexCode] = useState('');
  const [editingColor, setEditingColor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/colors`);
      setColors(response.data);
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
    setLoading(false);
  };

  const handleAddColor = async () => {
    try {
      const newColor = { name, hexCode };
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/colors`, newColor);
      setColors([...colors, response.data]);
      setName('');
      setHexCode('');
    } catch (error) {
      console.error('Error adding color:', error);
    }
  };

  const handleUpdateColor = async () => {
    try {
      const updatedColor = { name, hexCode };
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/colors/${editingColor._id}`, updatedColor);
      setColors(colors.map(color => (color._id === editingColor._id ? response.data : color)));
      setName('');
      setHexCode('');
      setEditingColor(null);
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const handleDeleteColor = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/colors/${id}`);
      setColors(colors.filter(color => color._id !== id));
    } catch (error) {
      console.error('Error deleting color:', error);
    }
  };

  const startEditing = (color) => {
    setName(color.name);
    setHexCode(color.hexCode);
    setEditingColor(color);
  };

  const filteredColors = colors.filter((color) => {
    const query = searchQuery.toLowerCase();
    return (
      color.name.toLowerCase().includes(query) || color.hexCode.toLowerCase().includes(query)
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
          <h1 className="text-3xl sm:text-4xl font-bold">Color Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search colors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (editingColor) handleUpdateColor();
            else handleAddColor();
          }}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingColor ? 'Update Color' : 'Add Color'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{editingColor ? 'Edit Color' : 'Add New Color'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Color Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded"
              required
            />
            <input
              type="text"
              placeholder="Hex Code"
              value={hexCode}
              onChange={(e) => setHexCode(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded"
              required
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Hex Code</th>
                <th className="py-2 px-4 border-b">Preview</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Loading colors...
                  </td>
                </tr>
              ) : filteredColors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No colors found.
                  </td>
                </tr>
              ) : (
                filteredColors.map((color) => (
                  <tr key={color._id} className="text-center">
                    <td className="py-2 px-4 border-b">{color.name}</td>
                    <td className="py-2 px-4 border-b">{color.hexCode}</td>
                    <td className="py-2 px-4 border-b">
                      <div style={{ backgroundColor: color.hexCode, width: '50px', height: '20px', margin: '0 auto', borderRadius: '4px' }}></div>
                    </td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button
                        className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => startEditing(color)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteColor(color._id)}
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

export default ColorManagement;
