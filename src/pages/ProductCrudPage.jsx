import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaRedo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProductCRUDPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'in'
  const navigate = useNavigate();

  // Fetch products from the API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Refresh products
  const handleRefresh = () => {
    fetchProducts();
  };

  // Navigate back to the previous page
  const handleBack = () => navigate(-1);

  // Navigate to product creation page
  const handleCreate = () => navigate("./createproducts");

  // Delete product function
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Toggle expanded view for stock details
  const toggleExpanded = (productId) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Build display helpers per product
  const normalizedProducts = products.map((p) => {
    const categoriesStr = Array.isArray(p.categories) ? p.categories.join(", ") : (p.categories || "");
    const variantCount = Array.isArray(p.variants) ? p.variants.length : 0;
    const shippingNames = Array.isArray(p.variants)
      ? Array.from(new Set(
          p.variants
            .map(v => v.shippingName)
            .filter(Boolean)
        ))
      : [];
    const shippingLabel = shippingNames.length === 0
      ? "-"
      : shippingNames.length === 1
        ? shippingNames[0]
        : `${shippingNames[0]} +${shippingNames.length - 1}`;
    
    // Calculate total stock across all variants
    const totalStock = Array.isArray(p.variants) 
      ? p.variants.reduce((total, variant) => {
          if (variant.stockBySize && Array.isArray(variant.stockBySize)) {
            return total + variant.stockBySize.reduce((sum, stock) => sum + (stock || 0), 0);
          }
          return total + (variant.stock || 0);
        }, 0)
      : 0;
    
    // Calculate variant stock breakdown
    const variantStockBreakdown = Array.isArray(p.variants) 
      ? p.variants.map(variant => {
          const variantTotalStock = variant.stockBySize && Array.isArray(variant.stockBySize)
            ? variant.stockBySize.reduce((sum, stock) => sum + (stock || 0), 0)
            : (variant.stock || 0);
          
          return {
            color: variant.colorName || 'Unknown',
            stock: variantTotalStock,
            sizes: variant.sizes || [],
            stockBySize: variant.stockBySize || []
          };
        })
      : [];
    
    const stockStatus = totalStock === 0 
      ? { text: 'Out of Stock', color: 'text-red-600' }
      : totalStock < 10 
        ? { text: `Low Stock (${totalStock})`, color: 'text-indigo-600' }
        : { text: `In Stock (${totalStock})`, color: 'text-green-600' };
    
    return { 
      ...p, 
      _brand: p.brand || '',
      _categoriesStr: categoriesStr, 
      _variantCount: variantCount, 
      _shippingLabel: shippingLabel, 
      _shippingNames: shippingNames,
      _totalStock: totalStock,
      _stockStatus: stockStatus,
      _variantStockBreakdown: variantStockBreakdown
    };
  });

  // Filtered products based on the search query and stock filter
  const filteredProducts = normalizedProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      product.name?.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      (product._brand && product._brand.toLowerCase().includes(query)) ||
      (product._categoriesStr && product._categoriesStr.toLowerCase().includes(query)) ||
      (product._shippingNames && product._shippingNames.join(", ").toLowerCase().includes(query))
    );

    // Apply stock filter
    let matchesStockFilter = true;
    switch (stockFilter) {
      case 'low':
        matchesStockFilter = product._totalStock > 0 && product._totalStock <= 10;
        break;
      case 'out':
        matchesStockFilter = product._totalStock === 0;
        break;
      case 'in':
        matchesStockFilter = product._totalStock > 10;
        break;
      default:
        matchesStockFilter = true;
    }

    return matchesSearch && matchesStockFilter;
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      {/* Top Bar */}
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="flex items-center text-gray-700 hover:text-gray-900 transition" aria-label="Go Back">
            <FaArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">Product Management</h1>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white rounded-md shadow-sm">
            <FaSearch className="text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh} 
            className="flex items-center bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition"
            disabled={loading}
          >
            <FaRedo className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </button>
          <button onClick={handleCreate} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            <FaPlus className="mr-2" /> Create
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        {/* Stock Summary */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              Total Products: {filteredProducts.length}
            </div>
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>In Stock: {filteredProducts.filter(p => p._totalStock > 10).length}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                <span>Low Stock: {filteredProducts.filter(p => p._totalStock > 0 && p._totalStock <= 10).length}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span>Out of Stock: {filteredProducts.filter(p => p._totalStock === 0).length}</span>
              </div>
              <div className="flex items-center border-l pl-4">
                <span className="font-medium">Total Stock: {filteredProducts.reduce((sum, p) => sum + p._totalStock, 0)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Image</th>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Brand</th>
                <th className="py-2 px-4 border-b">Price ($)</th>
                <th className="py-2 px-4 border-b">SKU</th>
                <th className="py-2 px-4 border-b">Category</th>
                <th className="py-2 px-4 border-b">Variants</th>
                <th className="py-2 px-4 border-b">Stock</th>
                <th className="py-2 px-4 border-b">Shipping</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="text-center">
                    <td className="py-2 px-4 border-b">
                      <img
                        src={product.mainImage || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{product.name}</td>
                    <td className="py-2 px-4 border-b">{product._brand || '-'}</td>
                    <td className="py-2 px-4 border-b">{parseFloat(product.mainPrice).toFixed(2)}</td>
                    <td className="py-2 px-4 border-b">{product.sku || "N/A"}</td>
                    <td className="py-2 px-4 border-b">{product._categoriesStr || "N/A"}</td>
                    <td className="py-2 px-4 border-b">{product._variantCount}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${product._stockStatus.color}`}>
                            {product._stockStatus.text}
                          </span>
                          <button
                            onClick={() => toggleExpanded(product._id)}
                            className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                          >
                            {expandedProducts.has(product._id) ? 'Hide' : 'Details'}
                          </button>
                        </div>
                        
                        {product._variantStockBreakdown.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {product._variantStockBreakdown.map((variant, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{variant.color}:</span>
                                <span className={variant.stock === 0 ? 'text-red-500' : variant.stock < 5 ? 'text-indigo-500' : 'text-green-600'}>
                                  {variant.stock}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Expanded detailed view */}
                        {expandedProducts.has(product._id) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium mb-1">Size Details:</div>
                            {product._variantStockBreakdown.map((variant, idx) => (
                              <div key={idx} className="mb-2">
                                <div className="font-medium text-gray-700">{variant.color}:</div>
                                <div className="ml-2">
                                  {variant.sizes.map((size, sizeIdx) => {
                                    const stock = variant.stockBySize[sizeIdx] || 0;
                                    return (
                                      <div key={sizeIdx} className="flex justify-between">
                                        <span>{size}:</span>
                                        <span className={stock === 0 ? 'text-red-500' : stock < 3 ? 'text-indigo-500' : 'text-green-600'}>
                                          {stock}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">{product._shippingLabel}</td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button
                        className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => navigate(`./${product._id}`)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleDelete(product._id)}
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

export default ProductCRUDPage;
