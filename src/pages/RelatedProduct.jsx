import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RelatedProductsManagement = () => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [relatedName, setRelatedName] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedProducts();
    fetchProducts();
  }, []);

  const fetchRelatedProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/relatedproduct`);
      setRelatedProducts(response.data);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddRelatedProduct = async () => {
    const selectedProductData = selectedProductIds.map(id => products.find(product => product._id === id));
    if (!selectedProductData.length || !relatedName) return;

    const relatedProductData = {
      name: relatedName,
      relatedProducts: selectedProductData.map(product => ({
        productId: product._id,
        name: product.name,
        mainPrice: product.mainPrice,
        discountPrice: product.discountPrice,
        mainBadgeName: product.mainBadgeName,
        mainBadgeColor: product.mainBadgeColor,
        mainImage: product.mainImage,
      })),
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/createrelatedproduct`, relatedProductData);
      setRelatedProducts([...relatedProducts, response.data]);
      setRelatedName('');
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Error adding related product:', error);
    }
  };

  const handleUpdateRelatedProduct = async () => {
    const selectedProductData = selectedProductIds.map(id => products.find(product => product._id === id));
    if (!selectedProductData.length || !relatedName) return;

    const updatedRelatedProductData = {
      name: relatedName,
      relatedProducts: selectedProductData.map(product => ({
        productId: product._id,
        name: product.name,
        mainPrice: product.mainPrice,
        discountPrice: product.discountPrice,
        mainBadgeName: product.mainBadgeName,
        mainBadgeColor: product.mainBadgeColor,
        mainImage: product.mainImage,
      })),
    };

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/updaterelatedproduct/${editingProduct._id}`, updatedRelatedProductData);
      setRelatedProducts(relatedProducts.map(item => (item._id === editingProduct._id ? response.data : item)));
      setRelatedName('');
      setSelectedProductIds([]);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating related product:', error);
    }
  };

  const handleDeleteRelatedProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this related product group?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URI}/api/deleterelatedproduct/${id}`);
        setRelatedProducts(relatedProducts.filter(item => item._id !== id));
      } catch (error) {
        console.error('Error deleting related product:', error);
      }
    }
  };

  const startEditing = (relatedProduct) => {
    setRelatedName(relatedProduct.name);
    setSelectedProductIds(relatedProduct.relatedProducts.map(product => product.productId));
    setEditingProduct(relatedProduct);
  };

  const filteredRelatedProducts = relatedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const handleProductSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedProductIds(selectedOptions);
  };

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
          <h1 className="text-3xl sm:text-4xl font-bold">Related Products Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search related products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => (editingProduct ? handleUpdateRelatedProduct() : handleAddRelatedProduct())}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingProduct ? 'Update Related Product' : 'Add Related Product'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaLink className="mr-2 text-blue-500" />
            {editingProduct ? 'Edit Related Product Group' : 'Add New Related Product Group'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                type="text"
                placeholder="Enter related product group name..."
                value={relatedName}
                onChange={(e) => setRelatedName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Products</label>
              <select
                multiple
                value={selectedProductIds}
                onChange={handleProductSelect}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-auto min-h-[120px]"
                size="6"
              >
                {filteredProducts.length === 0 ? (
                  <option disabled>No products found matching your search</option>
                ) : (
                  filteredProducts.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - BDT{product.mainPrice}
                    </option>
                  ))
                )}
              </select>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple products</p>
                <p className="text-xs text-gray-500">
                  {filteredProducts.length} of {products.length} products
                </p>
              </div>
            </div>
            {selectedProductIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected Products ({selectedProductIds.length})</label>
                <div className="bg-gray-50 p-3 rounded border">
                  {selectedProductIds.map(productId => {
                    const product = products.find(p => p._id === productId);
                    return product ? (
                      <div key={productId} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-700">{product.name}</span>
                        <span className="text-sm text-gray-500">BDT{product.mainPrice}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Group Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Products Count</th>
                <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading related products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRelatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No related product groups found matching your search.' : 'No related product groups found.'}
                  </td>
                </tr>
              ) : (
                filteredRelatedProducts.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4 font-medium text-gray-800">{product.name}</td>
                    <td className="py-3 px-4 text-gray-600">{product.relatedProducts?.length || 0} products</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="flex items-center bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                          onClick={() => startEditing(product)}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          onClick={() => handleDeleteRelatedProduct(product._id)}
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

export default RelatedProductsManagement;
