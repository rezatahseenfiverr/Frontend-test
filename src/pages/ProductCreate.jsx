import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProductCreate = () => {
  // Dropdown options state
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [badges, setBadges] = useState([]);
  const [measureTypes, setMeasureTypes] = useState([]);
  const [shippingTypes, setShippingTypes] = useState([]);

  // Product info state
  const [product, setProduct] = useState({
    name: '',
    categories: [],
    mainPrice: '',
    discountPrice: '',
    mainBadgeName: '',
    mainBadgeColor: '',
    gender: '',
    measureType: '',
    unitName: '',
    variants: [],
    mainImage: null,
  });

  // Variant form state
  const [variant, setVariant] = useState({
    selectedColor: '',
    selectedColorHex: '',
    sizes: [],
    prices: [],
    discountPrices: [],
    badgeNames: [],
    badgeColors: [],
    stockBySize: [], // Changed to stockBySize array
    description: '',
    images: [], // Now will be [{file, preview}]
    shippingIds: [],
    specifications: [],
  });

  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isVariantVisible, setIsVariantVisible] = useState(false);
  const [variantCount, setVariantCount] = useState(0);

  const navigate = useNavigate();

  // Fetch dropdown options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesRes, colorsRes, sizesRes, gendersRes, badgesRes, unitsRes, shippingRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URI}/api/categories`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/colors`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/sizes`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/genders`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/badges`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/units`),
          axios.get(`${import.meta.env.VITE_API_URI}/api/shipping`),
        ]);

        setCategories(categoriesRes.data);
        setColors(colorsRes.data);
        setSizes(sizesRes.data);
        setGenders(gendersRes.data);
        setBadges(badgesRes.data);
        setMeasureTypes(unitsRes.data);
        setShippingTypes(shippingRes.data || []);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  // Prepare options for react-select
  const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));
  const colorOptions = colors.map(c => ({ value: c.name, label: `${c.name} (${c.hexCode})` }));
  const sizeOptions = sizes.map(s => ({ value: s.name, label: s.name }));
  const genderOptions = genders.map(g => ({ value: g.type, label: g.type }));
  const badgeOptions = badges.map(b => ({ value: b.name, label: `${b.name} (${b.color})` }));
  const measureTypeOptions = measureTypes.map(m => ({
    value: m.measureType,
    label: `${m.measureType} (${m.unitName})`,
    unitName: m.unitName,
  }));
  const shippingOptions = shippingTypes.map(s => ({ value: s._id, label: `${s.name} ($${Number(s.charge).toFixed(2)}, ${s.estimatedDays}d)` }));

  // Product input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mainBadgeName') {
      const selectedBadge = badges.find((badge) => badge.name === value);
      const mainBadgeColor = selectedBadge ? selectedBadge.color : '';
      setProduct((prev) => ({
        ...prev,
        mainBadgeName: value,
        mainBadgeColor,
      }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Variant form input change handler
  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariant((prev) => ({ ...prev, [name]: value }));
  };

  // Variant image upload handler
  const handleVariantImageChange = (e) => {
    setVariant((prev) => ({ ...prev, images: Array.from(e.target.files) }));
  };

  // Add size-price-discountPrice row
  const addSizePrice = () => {
    setVariant((prev) => ({
      ...prev,
      sizes: [...prev.sizes, ''],
      prices: [...prev.prices, ''],
      discountPrices: [...prev.discountPrices, ''],
      stockBySize: [...prev.stockBySize, ''], // Add empty stock for new size
    }));
  };

  // Add specification row
  const addSpecification = () => {
    setVariant((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: '', value: '', unit: '' }],
    }));
  };

  // Handle specification change by index
  const handleSpecificationChange = (index, field, value) => {
    setVariant((prev) => {
      const updatedSpecs = [...prev.specifications];
      updatedSpecs[index] = { ...updatedSpecs[index], [field]: value };
      return { ...prev, specifications: updatedSpecs };
    });
  };

  // Remove specification by index
  const removeSpecification = (index) => {
    setVariant((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Handle size/price/discountPrice change by index
  const handleSizePriceChange = (index, value, type) => {
    setVariant((prev) => {
      const updatedArray = [...prev[type]];
      updatedArray[index] = value;
      return { ...prev, [type]: updatedArray };
    });
  };

  // React-select handlers
  const handleCategoriesChange = (selectedOptions) => {
    setProduct((prev) => ({
      ...prev,
      categories: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
    }));
  };

  const handleMainBadgeChange = (selectedOption) => {
    const badgeColor = selectedOption
      ? badges.find((b) => b.name === selectedOption.value)?.color || ''
      : '';
    setProduct((prev) => ({
      ...prev,
      mainBadgeName: selectedOption ? selectedOption.value : '',
      mainBadgeColor: badgeColor,
    }));
  };

  const handleGenderChange = (selectedOption) => {
    setProduct((prev) => ({
      ...prev,
      gender: selectedOption ? selectedOption.value : '',
    }));
  };

  const handleMeasureTypeChange = (selectedOption) => {
    setProduct((prev) => ({
      ...prev,
      measureType: selectedOption ? selectedOption.value : '',
    }));
  };

  const handleVariantColorChange = (selectedOption) => {
    const hex = selectedOption ? colors.find(c => c.name === selectedOption.value)?.hexCode || '' : '';
    setVariant((prev) => ({
      ...prev,
      selectedColor: selectedOption ? selectedOption.value : '',
      selectedColorHex: hex,
    }));
  };

  const handleVariantBadgesChange = (selectedOptions) => {
    const names = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    const colorsForBadges = names.map(name => {
      const badge = badges.find(b => b.name === name);
      return badge ? badge.color : '';
    });
    setVariant((prev) => ({
      ...prev,
      badgeNames: names,
      badgeColors: colorsForBadges,
    }));
  };

  // Main image upload
  const handleMainImageChange = (e) => {
    setProduct((prev) => ({ ...prev, mainImage: e.target.files[0] }));
  };

  // Add or update variant
  const saveVariant = () => {
    if (!variant.selectedColor || variant.sizes.length === 0 || !variant.stockBySize.length) {
      alert('Please fill in all required fields for the variant.');
      return;
    }

    if (editingVariantIndex === null) {
      // Add new variant
      if (variantCount >= 5) {
        alert('You can only add up to 5 variants.');
        return;
      }
      setProduct((prev) => ({
        ...prev,
        variants: [...prev.variants, { ...variant }],
      }));
      setVariantCount((prev) => prev + 1);
    } else {
      // Update existing variant
      setProduct((prev) => {
        const newVariants = [...prev.variants];
        newVariants[editingVariantIndex] = { ...variant };
        return {
          ...prev,
          variants: newVariants,
        };
      });
    }

    // Reset variant form
    setVariant({
      selectedColor: '',
      selectedColorHex: '',
      sizes: [],
      prices: [],
      discountPrices: [],
      badgeNames: [],
      badgeColors: [],
      stockBySize: [],
      description: '',
      images: [],
      shippingIds: [],
      specifications: [],
    });
    setEditingVariantIndex(null);
    setIsVariantVisible(false);
  };

  // Edit variant - load data into variant form
  const editVariant = (index) => {
    const v = product.variants[index];
    setVariant({
      ...v,
      images: v.images.map(imgObj =>
        imgObj.preview
          ? imgObj
          : { ...imgObj, preview: URL.createObjectURL(imgObj.file) }
      ),
    });
    setEditingVariantIndex(index);
    setIsVariantVisible(true);
  };

  // Remove variant by index
  const removeVariant = (index) => {
    setProduct((prev) => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
    setVariantCount((prev) => Math.max(prev - 1, 0));

    if (editingVariantIndex === index) {
      // Cancel editing if deleting edited variant
      setEditingVariantIndex(null);
      setIsVariantVisible(false);
      setVariant({
        selectedColor: '',
        selectedColorHex: '',
        sizes: [],
        prices: [],
        discountPrices: [],
        badgeNames: [],
        badgeColors: [],
        stockBySize: [],
        description: '',
        images: [],
        shippingIds: [],
      });
    }
  };

  // Cancel variant edit
  const cancelEdit = () => {
    setEditingVariantIndex(null);
    setIsVariantVisible(false);
    setVariant({
      selectedColor: '',
      selectedColorHex: '',
      sizes: [],
      prices: [],
      discountPrices: [],
      badgeNames: [],
      badgeColors: [],
      stockBySize: [],
      description: '',
      images: [],
      shippingIds: [],
    });
  };

  // Submit product data including variants to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check variant images
    for (let i = 0; i < product.variants.length; i++) {
      if (!product.variants[i].images || product.variants[i].images.length === 0) {
        alert(`Please upload images for variant ${i + 1}.`);
        return;
      }
    }

    try {
      console.log( 'Submitting product data:', product, variant); // Debugging log

      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('categories', JSON.stringify(product.categories));
      formData.append('mainPrice', product.mainPrice);
      formData.append('discountPrice', product.discountPrice);
      formData.append('mainBadgeName', product.mainBadgeName);
      formData.append('mainBadgeColor', product.mainBadgeColor);
      formData.append('gender', product.gender);
      formData.append('measureType', product.measureType);
      formData.append('unitName', product.unitName);
      formData.append('mainImage', product.mainImage);
      

      // Prepare variants without images for JSON
      const variantsWithoutImages = product.variants.map((variant) => ({
        colorName: variant.selectedColor,
        hexCode: variant.selectedColorHex,
        sizes: variant.sizes,
        prices: variant.prices,
        discountPrices: variant.discountPrices,
        badgeNames: variant.badgeNames,
        badgeColors: variant.badgeColors,
        stockBySize: variant.stockBySize, // Changed to stockBySize
        description: variant.description,
        measureType: product.measureType, // <-- include
        unitName: product.unitName,       // <-- include
        shippingIds: Array.isArray(variant.shippingIds) ? variant.shippingIds : (variant.shippingId ? [variant.shippingId] : []),
        specifications: Array.isArray(variant.specifications) ? variant.specifications : [],
      }));

      formData.append('variants', JSON.stringify(variantsWithoutImages));

      // Append variant images
      product.variants.forEach((variant, index) => {
        variant.images.forEach((imgObj) => {
          formData.append(`images-${index}`, imgObj.file);
        });
      });

      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMessage('Product created successfully!');

      // Reset product and variant states
      setProduct({
        name: '',
        categories: [],
        mainPrice: '',
        discountPrice: '',
        mainBadgeName: '',
        mainBadgeColor: '',
        gender: '',
        measureType: '',
        variants: [],
        mainImage: null,
      });
      setVariant({
        selectedColor: '',
        selectedColorHex: '',
        sizes: [],
        prices: [],
        discountPrices: [],
        badgeNames: [],
        badgeColors: [],
        stockBySize: [],
        description: '',
        images: [],
      });
      setVariantCount(0);
      setIsVariantVisible(false);
      setEditingVariantIndex(null);

      // Optionally navigate somewhere
      // navigate('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 md:pl-[400px] sm:p-10 md:p-20"
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Create Product</h1>
      {successMessage && (
        <div className="bg-green-100 text-green-700 border border-green-300 p-4 mb-4 rounded">
          {successMessage}
        </div>
      )}
      <div className="p-6 border-2 border-gray-300 border-dashed rounded-lg shadow-lg bg-white w-full max-w-5xl">
        {/* Product Info Inputs */}
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleInputChange}
          className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <Select
          isMulti
          name="categories"
          options={categoryOptions}
          className="mb-4"
          classNamePrefix="select"
          value={categoryOptions.filter((opt) => product.categories.includes(opt.value))}
          onChange={handleCategoriesChange}
          placeholder="Select Categories"
        />

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

        <Select
          name="mainBadgeName"
          options={badgeOptions}
          className="mb-4"
          classNamePrefix="select"
          value={badgeOptions.find((opt) => opt.value === product.mainBadgeName) || null}
          onChange={handleMainBadgeChange}
          placeholder="Select Main Badge"
          isClearable
        />

        <Select
          name="gender"
          options={genderOptions}
          className="mb-4"
          classNamePrefix="select"
          value={genderOptions.find((opt) => opt.value === product.gender) || null}
          onChange={handleGenderChange}
          placeholder="Select Gender"
          isClearable
        />

        <Select
          name="measureType"
          options={measureTypeOptions}
          className="mb-4"
          classNamePrefix="select"
          value={measureTypeOptions.find(
            (opt) =>
              opt.value === product.measureType &&
              opt.unitName === product.unitName
          ) || null}
          onChange={(selectedOption) => {
            setProduct((prev) => ({
              ...prev,
              measureType: selectedOption ? selectedOption.value : '',
              unitName: selectedOption ? selectedOption.unitName : '',
            }));
          }}
          placeholder="Select Measure Type (Unit)"
          isClearable
        />

        <input
          type="file"
          name="mainImage"
          onChange={handleMainImageChange}
          className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Variant Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Variant Information</h2>

          {isVariantVisible && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <Select
                  name="selectedColor"
                  options={colorOptions}
                  className="mb-4"
                  classNamePrefix="select"
                  value={colorOptions.find((opt) => opt.value === variant.selectedColor) || null}
                  onChange={handleVariantColorChange}
                  placeholder="Select Color"
                  isClearable
                  required
                />

                <input
                  type="number"
                  name="stock"
                  placeholder="Total Stock Quantity"
                  value={variant.stockBySize.reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)}
                  onChange={(e) => {
                    const totalStock = parseInt(e.target.value) || 0;
                    const stockPerSize = variant.sizes.length > 0 ? Math.floor(totalStock / variant.sizes.length) : 0;
                    const remainder = totalStock % variant.sizes.length;
                    const newStock = variant.sizes.map((_, index) => 
                      index < remainder ? stockPerSize + 1 : stockPerSize
                    );
                    setVariant(prev => ({ ...prev, stockBySize: newStock }));
                  }}
                  className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <textarea
                  name="description"
                  placeholder="Variant Description"
                  value={variant.description}
                  onChange={handleVariantChange}
                  className="px-4 py-3 border border-gray-300 bg-white rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Shipping Types (multi)</label>
                  <Select
                    isMulti
                    name="shippingIds"
                    options={shippingOptions}
                    classNamePrefix="select"
                    value={shippingOptions.filter(opt => (variant.shippingIds||[]).includes(opt.value))}
                    onChange={(opts)=> setVariant(prev => ({ ...prev, shippingIds: (opts||[]).map(o=>o.value) }))}
                    placeholder="Select Shipping Types"
                    isClearable
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Variant Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const preview = URL.createObjectURL(file);
                        setVariant(prev => ({
                          ...prev,
                          images: [...prev.images, { file, preview }]
                        }));
                      }
                      e.target.value = '';
                    }}
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-4">
                    {variant.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img.preview}
                          alt={`variant-img-${idx}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        {/* Delete Button */}
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1"
                          onClick={() => {
                            setVariant(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx)
                            }));
                          }}
                          title="Delete Image"
                        >
                          <FaTrash size={14} />
                        </button>
                        {/* Edit Button */}
                        <label
                          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer"
                          title="Edit Image"
                        >
                          <FaEdit size={14} />
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                const preview = URL.createObjectURL(file);
                                setVariant(prev => {
                                  const newImages = [...prev.images];
                                  newImages[idx] = { file, preview };
                                  return { ...prev, images: newImages };
                                });
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Sizes and Prices</h3>
                {variant.sizes.map((size, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Select
                      options={sizeOptions}
                      value={sizeOptions.find((opt) => opt.value === size) || null}
                      onChange={(selectedOption) =>
                        handleSizePriceChange(index, selectedOption ? selectedOption.value : '', 'sizes')
                      }
                      className="flex-2"
                      classNamePrefix="select"
                      placeholder="Select Size"
                      isClearable
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={variant.prices[index]}
                      onChange={(e) => handleSizePriceChange(index, e.target.value, 'prices')}
                      className="w-50 px-2 py-1 border bg-white border-gray-300 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Discount Price"
                      value={variant.discountPrices[index]}
                      onChange={(e) => handleSizePriceChange(index, e.target.value, 'discountPrices')}
                      className="w-50 px-2 py-1 border bg-white border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.stockBySize[index]}
                      onChange={(e) => {
                        const newStock = [...variant.stockBySize];
                        newStock[index] = e.target.value;
                        setVariant(prev => ({ ...prev, stockBySize: newStock }));
                      }}
                      className="w-50 px-2 py-1 border bg-white border-gray-300 rounded"
                      required
                    />
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setVariant((prev) => {
                          const sizes = [...prev.sizes];
                          const prices = [...prev.prices];
                          const discountPrices = [...prev.discountPrices];
                          const stockBySize = [...prev.stockBySize];
                          sizes.splice(index, 1);
                          prices.splice(index, 1);
                          discountPrices.splice(index, 1);
                          stockBySize.splice(index, 1);
                          return { ...prev, sizes, prices, discountPrices, stockBySize };
                        });
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSizePrice}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  <FaPlus /> Add Size
                </button>
              </div>

              <Select
                isMulti
                name="badgeNames"
                options={badgeOptions}
                className="mb-4"
                classNamePrefix="select"
                value={badgeOptions.filter((opt) => variant.badgeNames.includes(opt.value))}
                onChange={handleVariantBadgesChange}
                placeholder="Select Badges"
                isClearable
              />

              {/* Specifications Section */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Specifications</h3>
                {variant.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Specification Name"
                      value={spec.name}
                      onChange={(e) => handleSpecificationChange(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border bg-white border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="flex-1 px-2 py-1 border bg-white border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Unit (optional)"
                      value={spec.unit}
                      onChange={(e) => handleSpecificationChange(index, 'unit', e.target.value)}
                      className="w-32 px-2 py-1 border bg-white border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeSpecification(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecification}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  <FaPlus /> Add Specification
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={saveVariant}
                  className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition"
                >
                  {editingVariantIndex === null ? 'Add Variant' : 'Save Variant'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white px-6 py-3 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {!isVariantVisible && (
            <button
              type="button"
              onClick={() => setIsVariantVisible(true)}
              disabled={variantCount >= 5}
              className={`mt-4 bg-green-600 text-white px-6 py-3 rounded w-full hover:bg-green-700 transition ${
                variantCount >= 5 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Add Variant
            </button>
          )}
        </div>

        {/* Show added variants */}
        {product.variants.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Added Variants</h2>
            {product.variants.map((v, idx) => (
              <div
                key={idx}
                className="mb-6 p-4 border border-gray-300 rounded shadow-sm bg-gray-50 relative"
              >
                {/* Remove variant button */}
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  title="Remove Variant"
                >
                  <FaTrash size={18} />
                </button>

                {/* Edit variant button */}
                <button
                  type="button"
                  onClick={() => editVariant(idx)}
                  className="absolute top-2 right-10 text-blue-600 hover:text-blue-800"
                  title="Edit Variant"
                >
                  <FaEdit size={18} />
                </button>

                <p>
                  <strong>Color:</strong> {v.selectedColor}{' '}
                  <span style={{ color: v.selectedColorHex }}>■</span>
                </p>
                <p>
                  <strong>Stock:</strong> {v.stockBySize.join(', ')}
                </p>
                <p>
                  <strong>Description:</strong> {v.description}
                </p>
                <p>
                  <strong>Sizes & Prices:</strong>
                </p>
                <ul className="list-disc ml-6">
                  {v.sizes.map((size, i) => (
                    <li key={i}>
                      {size} {product.measureType && `(${product.measureType})`} — Price: {v.prices[i]} — Discount Price:{' '}
                      {v.discountPrices[i]}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Badges:</strong> {v.badgeNames.join(', ')}
                </p>
                <p>
                  <strong>Specifications:</strong>
                </p>
                <ul className="list-disc ml-6">
                  {v.specifications && v.specifications.length > 0 ? (
                    v.specifications.map((spec, i) => (
                      <li key={i}>
                        {spec.name}: {spec.value} {spec.unit}
                      </li>
                    ))
                  ) : (
                    <li>No specifications added</li>
                  )}
                </ul>
                <p>
                  <strong>Images:</strong> {v.images.length} file(s) uploaded
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={product.variants.length === 0}
          className={`mt-8 bg-indigo-600 text-white px-6 py-4 rounded w-full hover:bg-indigo-700 transition ${
            product.variants.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Create Product
        </button>
      </div>
    </form>
  );
};

export default ProductCreate;
