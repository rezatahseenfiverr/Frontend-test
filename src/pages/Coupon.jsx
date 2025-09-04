import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [editingCoupon, setEditingCoupon] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editingCoupon) {
      setCode(editingCoupon.code);
      setDiscount(editingCoupon.discount);
      setExpirationDate(editingCoupon.expirationDate.split('T')[0]);
      setIsActive(editingCoupon.isActive);
      
      // Set selected products
      const productIds = editingCoupon.applicableProducts?.map(ap => ap.product) || [];
      setSelectedProducts(productIds);
      
      // Set selected variants
      const variantsMap = {};
      editingCoupon.applicableProducts?.forEach(ap => {
        variantsMap[ap.product] = ap.variants?.map(v => ({
          variantId: v.variantId,
          color: v.color,
          size: v.size
        })) || [];
      });
      setSelectedVariants(variantsMap);
    }
  }, [editingCoupon]);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/coupons`);
      // Ensure we always set an array, even if response.data is null/undefined
      console.log("Fetched Coupons:", response.data);
      setCoupons(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("Failed to load coupons. Please try again.");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleAddOrUpdateCoupon = async () => {
    try {
      // Format applicableProducts to match backend structure
      const applicableProducts = selectedProducts.map(productId => {
        const variants = selectedVariants[productId] || [];
        
        // Group variants by variantId and collect sizes
        const variantGroups = variants.reduce((acc, { variantId, color, size }) => {
          if (!acc[variantId]) {
            acc[variantId] = { variantId, color, sizes: [] };
          }
          acc[variantId].sizes.push(size);
          return acc;
        }, {});

        return {
          product: productId,
          variants: Object.values(variantGroups).map(v => ({
            variantId: v.variantId,
            color: v.color,
            sizes: v.sizes
          }))
        };
      });

      const newCoupon = {
        code,
        discount: Number(discount),
        expirationDate,
        isActive,
        applicableProducts
      };

      if (editingCoupon) {
        await axios.put(`${import.meta.env.VITE_API_URI}/api/coupons/${editingCoupon._id}`, newCoupon);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URI}/api/coupons`, newCoupon);
      }
      
      fetchCoupons();
      resetForm();
    } catch (error) {
      console.error("Error saving coupon:", error);
      alert(error.response?.data?.message || "Error saving coupon");
    }
  };

  const resetForm = () => {
    setCode("");
    setDiscount("");
    setExpirationDate("");
    setIsActive(true);
    setSelectedProducts([]);
    setSelectedVariants({});
    setEditingCoupon(null);
  };

  const handleProductSelection = (e) => {
    const selectedOptions = [...e.target.selectedOptions].map(option => option.value);
    setSelectedProducts(selectedOptions);
    
    // Clear variants when products change
    setSelectedVariants(prev => {
      const newVariants = {...prev};
      Object.keys(newVariants).forEach(key => {
        if (!selectedOptions.includes(key)) {
          delete newVariants[key];
        }
      });
      return newVariants;
    });
  };

  const handleVariantSelection = (productId, variantId, color, size) => {
    setSelectedVariants(prev => {
      const productVariants = prev[productId] || [];
      const existingIndex = productVariants.findIndex(v => 
        v.variantId === variantId && v.size === size
      );
      
      if (existingIndex >= 0) {
        // Remove if already selected
        const updated = [...productVariants];
        updated.splice(existingIndex, 1);
        return {
          ...prev,
          [productId]: updated.length ? updated : []
        };
      } else {
        // Add new selection
        return {
          ...prev,
          [productId]: [
            ...productVariants,
            { variantId, color, size }
          ]
        };
      }
    });
  };

  const isVariantSelected = (productId, variantId, size) => {
    return selectedVariants[productId]?.some(
      v => v.variantId === variantId && v.size === size
    );
  };

  const getProductById = (productId) => {
    return products.find(product => product._id === productId);
  };

  const renderCouponDetails = (coupon) => {
    if (!coupon) return null;
    
    return (
      <div key={coupon._id} className="mb-4 border p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">
              {coupon.code} - {coupon.discount}% off
              {coupon.isActive === false && <span className="ml-2 text-red-500 text-sm">(Inactive)</span>}
            </h3>
            <p className="text-gray-600">
              Expires on: {new Date(coupon.expirationDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingCoupon(coupon)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={() => handleDeleteCoupon(coupon._id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
        
        {coupon.applicableProducts?.length > 0 && (
          <div className="mt-3">
            <h4 className="text-md font-semibold">Applicable Products:</h4>
            {coupon.applicableProducts.map((item, index) => {
              const product = getProductById(item.product);
              return (
                <div key={index} className="mt-2 ml-2 p-2 bg-gray-50 rounded">
                  <h5 className="font-medium">{product?.name || 'Product not found'}</h5>
                  {item.variants?.length > 0 ? (
                    <div className="ml-2 mt-1">
                      {item.variants.map((variant, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {variant.color} - Size: {variant.sizes?.join(', ') || 'N/A'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">All variants</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URI}/api/coupons/${couponId}`);
        fetchCoupons();
      } catch (error) {
        console.error("Error deleting coupon:", error);
        alert("Error deleting coupon");
      }
    }
  };

  // Filter coupons safely
  const filteredCoupons = Array.isArray(coupons) 
    ? coupons.filter(coupon => 
        coupon?.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

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
          <h1 className="text-3xl sm:text-4xl font-bold">Coupon Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAddOrUpdateCoupon}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
          disabled={!code || !discount || !expirationDate}
        >
          <FaPlus className="mr-2" /> {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
        </button>
      </div>

      {/* Coupon Add/Edit Form */}
      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl mb-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaTicketAlt className="mr-2 text-blue-500" />
            {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                placeholder="e.g. 20"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active Coupon
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Products</label>
            <select 
              multiple 
              onChange={handleProductSelection} 
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-auto min-h-[100px]"
              value={selectedProducts}
              size="5"
            >
              <option value="" disabled>Select Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple products</p>
          </div>

          {selectedProducts.map((productId) => {
            const product = products.find(p => p._id === productId);
            if (!product) return null;
            
            return (
              <div key={productId} className="mb-4 p-3 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-2">{product.name}</h3>
                
                {product.variants?.length > 0 ? (
                  product.variants.map((variant) => (
                    <div key={variant._id} className="mb-3 ml-2 p-2 border rounded bg-white">
                      <h4 className="font-medium mb-1">{variant.colorName}</h4>
                      <div className="flex flex-wrap gap-2">
                        {variant.sizes?.map((size) => (
                          <button
                            key={`${variant._id}-${size}`}
                            type="button"
                            onClick={() => handleVariantSelection(
                              productId, 
                              variant._id, 
                              variant.colorName, 
                              size
                            )}
                            className={`px-3 py-1 rounded border text-sm ${
                              isVariantSelected(productId, variant._id, size)
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No variants available for this product</div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-3 mt-4">
            {editingCoupon && (
              <button
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-semibold mb-4">Existing Coupons</h2>
        
        {error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchCoupons}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading coupons...</span>
            </div>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {searchQuery ? 'No coupons found matching your search.' : 'No coupons found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map(renderCouponDetails)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponManagement;