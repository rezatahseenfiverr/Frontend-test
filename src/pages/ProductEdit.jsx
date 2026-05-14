// frontend/src/components/ProductCreate.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';

const ProductEdit = () => {
  // State variables for dropdown options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [badges, setBadges] = useState([]);
  const [shippingTypes, setShippingTypes] = useState([]);

  const {id} = useParams();
  
  // State for product information
  const [product, setProduct] = useState({
    name: '',
    categories: [],
    brand: '',
    mainPrice: '',
    discountPrice: '',
    mainBadgeName: '',
    mainBadgeColor: '',
    gender: '',
    variants: [],
    mainImage: null,
  });

  // New images selected per-variant (files to replace that variant's images)
  const [newVariantImages, setNewVariantImages] = useState({}); // { [variantIdx]: File[] }
  // Track images to delete per variant
  const [deleteVariantImages, setDeleteVariantImages] = useState({}); // { [variantIdx]: Set(url) }

  // Additional state variables
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Fetch dropdown options on component mount
  useEffect(() => {
    fetchOptions();
    
    // Initialize Socket.IO connection
    socketRef.current = io(`${import.meta.env.VITE_API_URI}`, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('adminAccessToken') || '' },
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Function to fetch dropdown options from the backend
  const fetchOptions = async () => {
    try {
      const [categoriesRes, brandsRes, colorsRes, sizesRes, gendersRes, badgesRes, productRes, shippingRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URI}/api/categories`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/brands`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/colors`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/sizes`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/genders`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/badges`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/products/${id}`),
        axios.get(`${import.meta.env.VITE_API_URI}/api/shipping`),
      ]);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setGenders(gendersRes.data);
      setBadges(badgesRes.data);
      setShippingTypes(shippingRes.data || []);

      // Normalize product for editing
      const prod = productRes.data;
      const normalizedVariants = (prod.variants || []).map(v => ({
        selectedColor: v.colorName || '',
        selectedColorHex: v.hexCode || '',
        sizes: Array.isArray(v.sizes) ? v.sizes : [],
        prices: Array.isArray(v.prices) ? v.prices : [],
        discountPrices: Array.isArray(v.discountPrices) ? v.discountPrices : [],
        badgeNames: Array.isArray(v.badgeNames) ? v.badgeNames : [],
        badgeColors: Array.isArray(v.badgeColors) ? v.badgeColors : [],
        stock: v.stock || '',
        stockBySize: Array.isArray(v.stockBySize) ? v.stockBySize : [],
        description: v.description || '',
        images: Array.isArray(v.images) ? v.images : [], // urls
        shippingIds: Array.isArray(v.shippingOptions) ? v.shippingOptions.map(o => o._id || o.shippingId).filter(Boolean) : [],
        specifications: Array.isArray(v.specifications) ? v.specifications : [],
      }));

      setProduct({
        name: prod.name || '',
        categories: Array.isArray(prod.categories) ? prod.categories : [],
        mainPrice: prod.mainPrice || '',
        discountPrice: prod.discountPrice || '',
        mainBadgeName: prod.mainBadgeName || '',
        mainBadgeColor: prod.mainBadgeColor || '',
        gender: prod.gender || '',
        variants: normalizedVariants,
        mainImage: prod.mainImage || null,
      });
      setDeleteVariantImages({});
      setNewVariantImages({});
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  // Handle changes in the main product form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mainBadgeName') {
      const selectedBadge = badges.find(badge => badge.name === value);
      const mainBadgeColor = selectedBadge ? selectedBadge.color : '';
      setProduct(prevProduct => ({
        ...prevProduct,
        mainBadgeName: value,
        mainBadgeColor: mainBadgeColor,
      }));
    } else if (name === 'categories') {
      setProduct(prevProduct => ({
        ...prevProduct,
        categories: Array.from(e.target.selectedOptions, (option) => option.value),
      }));
    } else {
      setProduct(prevProduct => ({ ...prevProduct, [name]: value }));
    }
  };

  // Per-variant handlers
  const updateVariantField = (idx, patch) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      variants[idx] = { ...variants[idx], ...patch };
      return { ...prev, variants };
    });
  };

  const handleVariantSizePriceChange = (vIdx, index, value, type) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      const arr = [...variants[vIdx][type]];
      arr[index] = value;
      variants[vIdx] = { ...variants[vIdx], [type]: arr };
      return { ...prev, variants };
    });
  };

  const addVariantSizeRow = (vIdx) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      variants[vIdx] = {
        ...variants[vIdx],
        sizes: [...variants[vIdx].sizes, ''],
        prices: [...variants[vIdx].prices, ''],
        discountPrices: [...variants[vIdx].discountPrices, ''],
      };
      return { ...prev, variants };
    });
  };

  const removeVariantSizeRow = (vIdx, index) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      const sizesArr = [...variants[vIdx].sizes];
      const pricesArr = [...variants[vIdx].prices];
      const discArr = [...variants[vIdx].discountPrices];
      sizesArr.splice(index, 1);
      pricesArr.splice(index, 1);
      discArr.splice(index, 1);
      variants[vIdx] = { ...variants[vIdx], sizes: sizesArr, prices: pricesArr, discountPrices: discArr };
      return { ...prev, variants };
    });
  };

  // Specification handling functions
  const addVariantSpecification = (vIdx) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      variants[vIdx] = {
        ...variants[vIdx],
        specifications: [...(variants[vIdx].specifications || []), { name: '', value: '', unit: '' }],
      };
      return { ...prev, variants };
    });
  };

  const removeVariantSpecification = (vIdx, index) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      const specsArr = [...(variants[vIdx].specifications || [])];
      specsArr.splice(index, 1);
      variants[vIdx] = { ...variants[vIdx], specifications: specsArr };
      return { ...prev, variants };
    });
  };

  const handleVariantSpecificationChange = (vIdx, index, field, value) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      const specsArr = [...(variants[vIdx].specifications || [])];
      specsArr[index] = { ...specsArr[index], [field]: value };
      variants[vIdx] = { ...variants[vIdx], specifications: specsArr };
      return { ...prev, variants };
    });
  };

  const handleSelectVariantImages = (vIdx, files) => {
    setNewVariantImages(prev => ({
      ...prev,
      [vIdx]: [ ...(prev[vIdx] || []), ...Array.from(files) ]
    }));
  };

  const toggleDeleteVariantImage = (vIdx, url) => {
    setDeleteVariantImages(prev => {
      const setForIdx = new Set(prev[vIdx] || []);
      if (setForIdx.has(url)) setForIdx.delete(url); else setForIdx.add(url);
      return { ...prev, [vIdx]: Array.from(setForIdx) };
    });
  };

  const clearVariantImagesSelection = (vIdx) => {
    setNewVariantImages(prev => ({ ...prev, [vIdx]: [] }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('categories', JSON.stringify(product.categories));
    formData.append('brand', product.brand);
    formData.append('broadcast', product.broadcast ? 'true' : 'false');
    formData.append('mainPrice', product.mainPrice);
    formData.append('discountPrice', product.discountPrice);
    formData.append('mainBadgeName', product.mainBadgeName);
    formData.append('mainBadgeColor', product.mainBadgeColor);
    formData.append('gender', product.gender);

    if (product.mainImage && typeof product.mainImage !== 'string') {
      formData.append('mainImage', product.mainImage);
    }

    // Build variants payload (no images, includes shippingIds)
    const variantsWithoutImages = product.variants.map((v) => ({
      colorName: v.selectedColor,
      hexCode: v.selectedColorHex,
      sizes: v.sizes,
      prices: v.prices,
      discountPrices: v.discountPrices,
      badgeNames: v.badgeNames,
      badgeColors: v.badgeColors,
      stock: v.stock,
      stockBySize: v.stockBySize,
      description: v.description,
      shippingIds: Array.isArray(v.shippingIds) ? v.shippingIds : (v.shippingId ? [v.shippingId] : []),
      specifications: Array.isArray(v.specifications) ? v.specifications : [],
    }));
    formData.append('variants', JSON.stringify(variantsWithoutImages));

    // Append only the variants whose images are being replaced and deletions
    Object.keys(newVariantImages).forEach((key) => {
      const vIdx = Number(key);
      const files = newVariantImages[vIdx];
      if (Array.isArray(files) && files.length > 0) {
        files.forEach((file) => {
          formData.append(`images-${vIdx}`, file);
        });
      }
    });

    Object.keys(deleteVariantImages).forEach((key) => {
      const vIdx = Number(key);
      const toDelete = deleteVariantImages[vIdx];
      if (Array.isArray(toDelete) && toDelete.length > 0) {
        formData.append(`deleteImages-${vIdx}`, JSON.stringify(toDelete));
      }
    });

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Product updated successfully!');
      
      // Emit socket event for product update
      if (socketRef.current) {
        socketRef.current.emit('productUpdated', {
          productId: id,
          updateType: 'product_updated',
          timestamp: new Date()
        });
      }
      
      // Refresh product
      fetchOptions();
      setNewVariantImages({});
      setDeleteVariantImages({});
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 md:pl-[400px]  sm:p-10 md:p-20">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Edit Product</h1>
      {successMessage && (
        <div className="bg-green-100 text-green-700 border border-green-300 p-4 mb-4 rounded">
          {successMessage}
        </div>
      )}
      <div className="p-6 border-2 border-gray-300 border-dashed rounded-lg shadow-lg bg-white w-full max-w-5xl">
        {/* Product Information */}
        <div className="mb-6">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={product.name}
            onChange={handleInputChange}
            className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            name="categories"
            value={product.categories}
            onChange={(e) =>
              setProduct({
                ...product,
                categories: Array.from(e.target.selectedOptions, (option) => option.value),
              })
            }
            multiple
            className="border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>
              Select Categories
            </option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="brand"
            value={product.brand}
            onChange={handleInputChange}
            className="border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No Brand</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={product.broadcast || false}
              onChange={(e) => setProduct(prev => ({ ...prev, broadcast: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Broadcast this product
          </label>
          <input
            type="number"
            name="mainPrice"
            placeholder="Main Price"
            value={product.mainPrice}
            onChange={handleInputChange}
            className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            name="discountPrice"
            placeholder="Discount Price"
            value={product.discountPrice}
            onChange={handleInputChange}
            className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="mainBadgeName"
            value={product.mainBadgeName}
            onChange={handleInputChange}
            className="border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select Main Badge
            </option>
            {badges.map((badge) => (
              <option key={badge._id} value={badge.name}>
                {badge.name} ({badge.color})
              </option>
            ))}
          </select>
          <select
            name="gender"
            value={product.gender}
            onChange={handleInputChange}
            className="border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>
              Select Gender
            </option>
            {genders.map((gender) => (
              <option key={gender._id} value={gender.type}>
                {gender.type}
              </option>
            ))}
          </select>
          <input
            type="file"
            name="mainImage"
            onChange={(e) => setProduct({ ...product, mainImage: e.target.files[0] })}
            className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Variant Information */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Variant Information</h2>

          {/* Display Added Variants with inline editors */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-gray-600">Color</th>
                  <th className="py-2 px-4 border-b text-gray-600">Sizes & Prices</th>
                  <th className="py-2 px-4 border-b text-gray-600">Specifications</th>
                  <th className="py-2 px-4 border-b text-gray-600">Shipping</th>
                  <th className="py-2 px-4 border-b text-gray-600">Existing Images</th>
                  <th className="py-2 px-4 border-b text-gray-600">Add/Replace Images</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No variants found.
                    </td>
                  </tr>
                ) : (
                  product.variants.map((v, vIdx) => (
                    <tr key={vIdx} className="align-top">
                      <td className="py-2 px-4 border-b">
                        <div>
                          <select
                            value={v.selectedColor}
                            onChange={(e)=>updateVariantField(vIdx, { selectedColor: e.target.value, selectedColorHex: (colors.find(c=>c.name===e.target.value)?.hexCode)||'' })}
                            className="border border-gray-300 bg-white rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Color</option>
                            {colors.map(c=> (
                              <option key={c._id} value={c.name}>{c.name} ({c.hexCode})</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2">
                          <textarea
                            value={v.description}
                            onChange={(e)=>updateVariantField(vIdx, { description: e.target.value })}
                            placeholder="Description"
                            className="w-full border rounded px-2 py-1 bg-white"
                            rows={2}
                          />
                        </div>
                        <div className="mt-2 text-sm">Stock:
                          <input type="number" value={v.stock} onChange={(e)=>updateVariantField(vIdx, { stock: e.target.value })} className="ml-2 border rounded px-2 py-1 w-24 bg-white" />
                        </div>
                        <div className="mt-2 text-sm">Stock by Size:
                          {v.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="flex items-center mt-1">
                              <span className="text-xs text-gray-600 w-12">{size}:</span>
                              <input 
                                type="number" 
                                value={v.stockBySize[sizeIdx] || 0} 
                                onChange={(e) => {
                                  const newStockBySize = [...(v.stockBySize || [])];
                                  newStockBySize[sizeIdx] = parseInt(e.target.value) || 0;
                                  updateVariantField(vIdx, { stockBySize: newStockBySize });
                                }} 
                                className="ml-1 border rounded px-2 py-1 w-16 bg-white text-xs" 
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {(v.sizes || []).map((size, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <select
                              value={size}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'sizes')}
                              className="border border-gray-300 bg-white rounded px-2 py-1"
                            >
                              <option value="">Select Size</option>
                              {sizes.map(s => (
                                <option key={s._id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Price"
                              value={v.prices[i]}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'prices')}
                              className="border rounded px-2 py-1 w-28 bg-white"
                            />
                            <input
                              type="number"
                              placeholder="Discount"
                              value={v.discountPrices[i]}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'discountPrices')}
                              className="border rounded px-2 py-1 w-28 bg-white"
                            />
                            <button type="button" className="text-red-600" onClick={()=>removeVariantSizeRow(vIdx, i)}>×</button>
                          </div>
                        ))}
                        <button type="button" className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={()=>addVariantSizeRow(vIdx)}>
                          <FaPlus className="mr-1" /> Add Size
                        </button>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {(v.specifications || []).map((spec, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Name"
                              value={spec.name}
                              onChange={(e)=>handleVariantSpecificationChange(vIdx, i, 'name', e.target.value)}
                              className="border border-gray-300 bg-white rounded px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Value"
                              value={spec.value}
                              onChange={(e)=>handleVariantSpecificationChange(vIdx, i, 'value', e.target.value)}
                              className="border border-gray-300 bg-white rounded px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Unit"
                              value={spec.unit}
                              onChange={(e)=>handleVariantSpecificationChange(vIdx, i, 'unit', e.target.value)}
                              className="border border-gray-300 bg-white rounded px-2 py-1 text-xs w-16"
                            />
                            <button type="button" className="text-red-600" onClick={()=>removeVariantSpecification(vIdx, i)}>×</button>
                          </div>
                        ))}
                        <button type="button" className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={()=>addVariantSpecification(vIdx)}>
                          <FaPlus className="mr-1" /> Add Spec
                        </button>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <div>
                          <select
                            value={v.selectedColor}
                            onChange={(e)=>updateVariantField(vIdx, { selectedColor: e.target.value, selectedColorHex: (colors.find(c=>c.name===e.target.value)?.hexCode)||'' })}
                            className="border border-gray-300 bg-white rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Color</option>
                            {colors.map(c=> (
                              <option key={c._id} value={c.name}>{c.name} ({c.hexCode})</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2">
                          <textarea
                            value={v.description}
                            onChange={(e)=>updateVariantField(vIdx, { description: e.target.value })}
                            placeholder="Description"
                            className="w-full border rounded px-2 py-1 bg-white"
                            rows={2}
                          />
                        </div>
                        <div className="mt-2 text-sm">Stock:
                          <input type="number" value={v.stock} onChange={(e)=>updateVariantField(vIdx, { stock: e.target.value })} className="ml-2 border rounded px-2 py-1 w-24 bg-white" />
                        </div>
                        <div className="mt-2 text-sm">Stock by Size:
                          {v.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="flex items-center mt-1">
                              <span className="text-xs text-gray-600 w-12">{size}:</span>
                              <input 
                                type="number" 
                                value={v.stockBySize[sizeIdx] || 0} 
                                onChange={(e) => {
                                  const newStockBySize = [...(v.stockBySize || [])];
                                  newStockBySize[sizeIdx] = parseInt(e.target.value) || 0;
                                  updateVariantField(vIdx, { stockBySize: newStockBySize });
                                }} 
                                className="ml-1 border rounded px-2 py-1 w-16 bg-white text-xs" 
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {(v.sizes || []).map((size, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <select
                              value={size}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'sizes')}
                              className="border border-gray-300 bg-white rounded px-2 py-1"
                            >
                              <option value="">Select Size</option>
                              {sizes.map(s => (
                                <option key={s._id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Price"
                              value={v.prices[i]}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'prices')}
                              className="border rounded px-2 py-1 w-28 bg-white"
                            />
                            <input
                              type="number"
                              placeholder="Discount"
                              value={v.discountPrices[i]}
                              onChange={(e)=>handleVariantSizePriceChange(vIdx, i, e.target.value, 'discountPrices')}
                              className="border rounded px-2 py-1 w-28 bg-white"
                            />
                            <button type="button" className="text-red-600" onClick={()=>removeVariantSizeRow(vIdx, i)}>×</button>
                          </div>
                        ))}
                        <button type="button" className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={()=>addVariantSizeRow(vIdx)}>
                          <FaPlus className="mr-1" /> Add Size
                        </button>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex flex-col gap-2">
                          <select
                            multiple
                            value={Array.isArray(v.shippingIds) ? v.shippingIds : []}
                            onChange={(e)=>{
                              const values = Array.from(e.target.selectedOptions).map(o=>o.value);
                              updateVariantField(vIdx, { shippingIds: values });
                            }}
                            className="border border-gray-300 bg-white rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                          >
                            {shippingTypes.map(s => (
                              <option key={s._id} value={s._id}>{s.name} (${Number(s.charge).toFixed(2)}, {s.estimatedDays}d)</option>
                            ))}
                          </select>
                          <button type="button" className="text-xs text-blue-600 underline self-start" onClick={()=>{
                            // apply this variant's shippingIds to all variants
                            setProduct(prev=>({
                              ...prev,
                              variants: prev.variants.map((vv, idx)=> idx===vIdx ? vv : { ...vv, shippingIds: Array.isArray(v.shippingIds)? [...v.shippingIds] : [] })
                            }));
                          }}>Apply to all variants</button>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex flex-wrap gap-3">
                          {(v.images || []).map(url => (
                            <label key={url} className="relative inline-block">
                              <img src={url} alt="variant" className="w-16 h-16 object-cover rounded border" />
                              <input
                                type="checkbox"
                                onChange={()=>toggleDeleteVariantImage(vIdx, url)}
                                className="absolute top-1 right-1 w-4 h-4"
                                checked={(deleteVariantImages[vIdx]||[]).includes(url)}
                              />
                            </label>
                          ))}
                        </div>
                        {(deleteVariantImages[vIdx]||[]).length > 0 && (
                          <div className="text-xs text-red-600 mt-1">Will delete: {(deleteVariantImages[vIdx]||[]).length} image(s)</div>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <input type="file" multiple accept="image/*" onChange={(e)=>handleSelectVariantImages(vIdx, e.target.files)} className="mb-2" />
                        {Array.isArray(newVariantImages[vIdx]) && newVariantImages[vIdx].length > 0 && (
                          <div className="text-xs text-gray-700">Selected: {newVariantImages[vIdx].length} file(s) <button type="button" className="ml-2 text-red-600" onClick={()=>clearVariantImagesSelection(vIdx)}>Clear</button></div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition w-full"
          >
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductEdit;
