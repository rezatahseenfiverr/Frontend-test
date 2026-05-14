import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    try {
      const newCategory = { name };
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/categories`, newCategory);
      setCategories([...categories, response.data]);
      setName('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const updatedCategory = { name };
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/categories/${editingCategory._id}`, updatedCategory);
      setCategories(categories.map(category => (category._id === editingCategory._id ? response.data : category)));
      setName('');
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/categories/${id}`);
      setCategories(categories.filter(category => category._id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const startEditing = (category) => {
    setName(category.name);
    setEditingCategory(category);
  };

  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.toLowerCase();
    return category.name.toLowerCase().includes(query);
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
          <h1 className="text-3xl sm:text-4xl font-bold">Category Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (editingCategory) handleUpdateCategory();
            else handleAddCategory();
          }}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingCategory ? 'Update Category' : 'Add Category'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="text-center py-4">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-4">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id} className="text-center">
                    <td className="py-2 px-4 border-b">{category.name}</td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button
                        className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => startEditing(category)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteCategory(category._id)}
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

export default CategoryManagement;
