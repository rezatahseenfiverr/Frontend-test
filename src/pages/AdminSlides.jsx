import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaImages } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SliderManagement = () => {
  const [slides, setSlides] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editingSlide, setEditingSlide] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlides();
    fetchProducts();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/slides`);
      setSlides(response.data);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddOrUpdateSlide = async () => {
    const selectedProduct = products.find(product => product._id === selectedProductId);
    if (!selectedProduct) return;

    const slideData = {
      productId: selectedProduct._id,
      name: selectedProduct.name,
      price: selectedProduct.mainPrice,
      discountPrice: selectedProduct.discountPrice,
      imageUrl: selectedProduct.mainImage,
      mainBadgeName: selectedProduct.mainBadgeName,
      mainBadgeColor: selectedProduct.mainBadgeColor
    };

    try {
      if (editingSlide) {
        const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/updateslides/${editingSlide._id}`, slideData);
        setSlides(slides.map(slide => (slide._id === editingSlide._id ? response.data : slide)));
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/createslides`, slideData);
        setSlides([...slides, response.data]);
      }
      setSelectedProductId('');
      setEditingSlide(null);
    } catch (error) {
      console.error(editingSlide ? 'Error updating slide:' : 'Error adding slide:', error);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URI}/api/deleteslides/${id}`);
        setSlides(slides.filter(slide => slide._id !== id));
      } catch (error) {
        console.error('Error deleting slide:', error);
      }
    }
  };

  const startEditing = (slide) => {
    setSelectedProductId(slide.productId);
    setEditingSlide(slide);
  };

  const filteredSlides = slides.filter(slide =>
    slide.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl sm:text-4xl font-bold">Slider Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search slides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAddOrUpdateSlide}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
          disabled={!selectedProductId}
        >
          <FaPlus className="mr-2" /> {editingSlide ? 'Update Slide' : 'Add Slide'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaImages className="mr-2 text-blue-500" />
            {editingSlide ? 'Edit Slide' : 'Add New Slide'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a product for the slide</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Product Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Price</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Discount Price</th>
                <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading slides...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSlides.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No slides found matching your search.' : 'No slides found.'}
                  </td>
                </tr>
              ) : (
                filteredSlides.map((slide) => (
                  <tr key={slide._id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4 font-medium text-gray-800">{slide.name}</td>
                    <td className="py-3 px-4 text-gray-600">BDT{slide.price}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {slide.discountPrice ? `BDT${slide.discountPrice}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="flex items-center bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                          onClick={() => startEditing(slide)}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          onClick={() => handleDeleteSlide(slide._id)}
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

export default SliderManagement;
