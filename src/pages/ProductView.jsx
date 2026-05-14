import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Badge from '../components/Badge';
import SEOHead from '../components/SEOHead';
import { CartContext } from '../context/CartContext';
import { UserContext } from '../context/UserContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaHeart, FaShare, FaStar, FaTruck, FaShieldAlt, FaUndo } from 'react-icons/fa';

const ProductView = () => {
  const { addToCart } = useContext(CartContext);
  const { isLoggedIn, toggleWishlist: toggleWish, wishlist, fetchWishlist } = useContext(UserContext);
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedDiscountPrice, setSelectedDiscountPrice] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [viewers, setViewers] = useState(0);
  const socketRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(true);
 
  // Fetch product data
  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products/${id}`);
      setProduct(response.data);
      setLikesCount(response.data.likesCount || 0);
      console.log("Fetched product:", response.data);

      if (response.data.variants && response.data.variants.length > 0) {
        const defaultVariant = response.data.variants[0];
        setSelectedVariant(defaultVariant);

        if (
          defaultVariant.sizes &&
          defaultVariant.prices &&
          defaultVariant.discountPrices &&
          defaultVariant.sizes.length > 0 &&
          defaultVariant.prices.length > 0 &&
          defaultVariant.discountPrices.length > 0
        ) {
          setSelectedSize(defaultVariant.sizes[0]);
          setSelectedPrice(defaultVariant.prices[0]);
          setSelectedDiscountPrice(defaultVariant.discountPrices[0]);
          setSelectedColor(defaultVariant.colorName);
        }

        setMainImage(defaultVariant.images[0]);
      } else {
        console.warn("No variants available for this product.");
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/products/${id}/reviews`);
      if (res.status === 200) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  // Fetch related products
  const fetchRelatedProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/relatedproductfront/${id}`, {
        params: { excludeId: id }
      });
      if (response.status === 200) {
        const relatedProductArray = response.data[0]?.relatedProducts || [];
        setRelatedProducts(relatedProductArray);
        console.log('Related Products:', relatedProductArray);
      } else {
        console.error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  // Fetch shipping options
  const fetchShippingOptions = async () => {
    try {
      setShippingLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/shipping`);
      if (response.status === 200) {
        setShippingOptions(response.data);
        console.log('Shipping Options:', response.data);
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchShippingOptions();

    socketRef.current = io(`${import.meta.env.VITE_API_URI}`, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('accessToken') || '' },
    });

    // Debug socket connection
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected from server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socketRef.current.emit('joinProduct', id);
    console.log('📡 Emitting joinProduct for product:', id);

    socketRef.current.on('viewerCountUpdate', (count) => {
      setViewers(count);
      console.log(count);
    });

    // Listen for product updates
    socketRef.current.on('productUpdate', (updateData) => {
      console.log('Product update received:', updateData);
      
      // Add update to real-time updates list
      setRealTimeUpdates(prev => [
        {
          id: Date.now(),
          type: updateData.updateType,
          message: getUpdateMessage(updateData),
          timestamp: new Date(),
          data: updateData
        },
        ...prev.slice(0, 4) // Keep only last 5 updates
      ]);

      // Handle different update types
      switch (updateData.updateType) {
        case 'product_updated':
          // Refresh product data
          fetchProduct();
          toast.info('Product information has been updated!', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
          });
          break;
        case 'stock_updated':
          // Refresh product data
          fetchProduct();
          toast.info(`Stock updated for size ${updateData.size}: ${updateData.newStock} available`, {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
          });
          break;
        case 'like':
          setLikesCount(updateData.likesCount);
          break;
        case 'product_deleted':
          // Show notification that product is no longer available
          toast.warning('This product has been removed from the store.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
          });
          break;
        default:
          break;
      }
    });

    // Listen for inventory assignment updates
    socketRef.current.on('inventoryAssignment', (assignmentData) => {
      console.log('📦 Inventory assignment received:', assignmentData);
      
      // Add update to real-time updates list
      setRealTimeUpdates(prev => [
        {
          id: Date.now(),
          type: 'inventory_assignment',
          message: getInventoryMessage(assignmentData),
          timestamp: new Date(),
          data: assignmentData
        },
        ...prev.slice(0, 4) // Keep only last 5 updates
      ]);

      // Refresh product data to get updated stock
      fetchProduct();
      
      // Show notification
      toast.info(getInventoryMessage(assignmentData), {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
      });
    });

    return () => {
      if (socketRef.current) {
        try { socketRef.current.emit('leaveProduct', id); } catch {}
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (product && product.categories && product.categories.length > 0) {
      fetchRelatedProducts(product.categories);
    }
  }, [product]);

  useEffect(() => {
    if (wishlist.length > 0 && id) {
      setIsWishlisted(wishlist.some(p => (p._id || p) === id));
    }
  }, [wishlist, id]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    console.log("Selected variant:", variant);

    if (variant.sizes && variant.prices && variant.discountPrices && variant.discountPrices.length > 0 && variant.sizes.length > 0 && variant.prices.length > 0) {
      setSelectedSize(variant.sizes[0]);
      setSelectedPrice(variant.prices[0]);
      setSelectedDiscountPrice(variant.discountPrices[0]);
      setSelectedColor(variant.colorName);
    } else {
      setSelectedSize(null);
      setSelectedPrice(null);
      setSelectedDiscountPrice(null);
      setSelectedColor(null);
    }
    setMainImage(variant.images[0]);
  };

  const handleSizeChange = (size) => {
    const sizeIndex = selectedVariant.sizes.indexOf(size);
    if (sizeIndex !== -1 && selectedVariant.prices[sizeIndex] !== undefined) {
      setSelectedSize(size);
      setSelectedPrice(selectedVariant.prices[sizeIndex]);
      setSelectedDiscountPrice(selectedVariant.discountPrices[sizeIndex]);
      console.log(`Selected size: ${size}, Price: ${selectedVariant.prices[sizeIndex]}`);
    }
  };

  const getShippingSummary = () => {
    if (shippingOptions.length > 0) {
      return shippingOptions
        .map(o => `${o.name} • BDT${Number(o.charge).toFixed(2)} • ${o.estimatedDays} days`)
        .join(' | ');
    }
    return 'Free shipping on orders over BDT50';
  };

  const getShippingOptions = () => {
    return shippingOptions;
  };

  const getVariantBadges = () => {
    if (selectedVariant && selectedVariant.badgeNames && selectedVariant.badgeColors) {
      const length = Math.min(selectedVariant.badgeNames.length, selectedVariant.badgeColors.length);
      const badges = [];
      for (let i = 0; i < length; i++) {
        badges.push({
          name: selectedVariant.badgeNames[i],
          color: selectedVariant.badgeColors[i],
        });
      }
      return badges;
    }
    return [];
  };

  const handleLike = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URI}/api/products/${id}/like`);
      setLikesCount(res.data.likesCount);
    } catch { toast.error('Failed to update like'); }
  };

  const handleAddToCart = () => {
    console.log(selectedVariant.measureType, selectedVariant.unitName);
    const productToAdd = {
      variantId: selectedVariant._id,
      productId: id,
      name: product.name,
      mainImage,
      price: selectedDiscountPrice ? selectedDiscountPrice : product.discountPrice,
      size: selectedSize,
      measureType: selectedVariant.measureType,
      unitName: selectedVariant.unitName,
      color: selectedColor,
      quantity: 1
    };
    addToCart(productToAdd);
    toast.success('Added to cart successfully!', {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Helper function to generate update messages
  const getUpdateMessage = (updateData) => {
    switch (updateData.updateType) {
      case 'product_updated':
        return 'Product information has been updated';
      case 'stock_updated':
        return `Stock updated for size ${updateData.size}: ${updateData.newStock} available`;
      case 'product_deleted':
        return 'Product has been removed from the store';
      default:
        return 'Product has been updated';
    }
  };

  // Helper function to generate inventory messages
  const getInventoryMessage = (assignmentData) => {
    switch (assignmentData.action) {
      case 'inventory_assigned':
        return `Inventory item assigned to order - stock may have decreased`;
      case 'inventory_removed':
        return `Inventory item removed from order - stock may have increased`;
      default:
        return 'Inventory status changed';
    }
  };

  const submitReview = async () => {
    if (!rating) {
      toast.error('Please select a rating', { position: 'top-center', autoClose: 2000, hideProgressBar: true });
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please login to review', { position: 'top-center', autoClose: 2000, hideProgressBar: true });
        setSubmitting(false);
        return;
      }
      await axios.post(
        `${import.meta.env.VITE_API_URI}/api/products/${id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(0);
      setComment('');
      fetchReviews();
      toast.success('Review submitted successfully!', { position: 'top-center', autoClose: 2000, hideProgressBar: true });
    } catch (err) {
      console.error('Submit review failed', err);
      toast.error(err.response?.data?.message || 'Failed to submit review', { position: 'top-center', autoClose: 2500, hideProgressBar: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead product={product} url={`/products/${id}`} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ToastContainer />
      {product && selectedVariant ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Product Images */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                {/* Main Image */}
                <div className="relative mb-4">
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                    />
                    {getVariantBadges().map((badge, index) => (
                      <Badge
                        key={index}
                        name={badge.name}
                        color={badge.color}
                        position={index % 2 === 0 ? "topRight" : "bottomLeft"}
                      />
                    ))}
                  </div>
                </div>

                {/* Thumbnail Images */}
                {selectedVariant.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {selectedVariant.images.map((image, index) => (
                      <button
                        key={index}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          mainImage === image 
                            ? 'border-blue-500 ring-2 ring-blue-300' 
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => setMainImage(image)}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Column - Product Details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* Viewer Count */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {viewers} {viewers === 1 ? 'person is' : 'people are'} viewing this product
                </div>

                {/* Real-time Updates */}
                {realTimeUpdates.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-800">Live Updates</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {realTimeUpdates.map((update) => (
                        <div key={update.id} className="text-xs text-blue-700 bg-white p-2 rounded border">
                          <div className="flex items-center justify-between">
                            <span>{update.message}</span>
                            <span className="text-blue-500">
                              {update.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                {/* Price and Badge */}
                <div className="flex items-center gap-4 mb-6">
                  {selectedDiscountPrice ? (
                    <>
                                      <span className="text-2xl text-gray-400 line-through">BDT{selectedPrice}</span>
                <span className="text-3xl text-blue-600 font-bold">BDT{selectedDiscountPrice}</span>
                    </>
                  ) : (
                    <>
                                      <span className="text-2xl text-gray-400 line-through">BDT{product.mainPrice}</span>
                <span className="text-3xl text-blue-600 font-bold">BDT{product.discountPrice}</span>
                    </>
                  )}
                  {product.mainBadgeName && product.mainBadgeColor && (
                    <Badge name={product.mainBadgeName} color={product.mainBadgeColor} position="topRight" />
                  )}
                </div>

                {/* Color Selector */}
                {product.variants.length > 1 && (
                  <div className="mb-6">
                    <p className="text-base font-semibold mb-3 text-gray-800">Color:</p>
                    <div className="flex space-x-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.hexCode}
                          style={{ backgroundColor: variant.hexCode }}
                          onClick={() => handleVariantChange(variant)}
                          className={`w-10 h-10 rounded-full border-4 transition-all duration-200 ${
                            selectedVariant.hexCode === variant.hexCode 
                              ? 'border-blue-500 scale-110 shadow-lg' 
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                          aria-label={`Select color ${variant.colorName}`}
                        >
                          <span className="sr-only">{variant.colorName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {selectedVariant.sizes && selectedVariant.sizes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-base font-semibold mb-3 text-gray-800">
                      {selectedVariant.measureType ? selectedVariant.measureType : "Size"}:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selectedVariant.sizes.map((size, index) => {
                        const stockBySize = selectedVariant.stockBySize || [];
                        const stock = stockBySize[index] || selectedVariant.stock || 0;
                        const isOutOfStock = stock <= 0;
                        const isSelected = size === selectedSize;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStock && handleSizeChange(size)}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 rounded-lg border font-semibold text-base transition-all duration-200 ${
                              isOutOfStock
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : isSelected 
                                  ? 'bg-blue-500 text-white shadow-lg border-blue-600' 
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-blue-50 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className={isSelected ? 'text-white' : isOutOfStock ? 'text-gray-400' : 'text-blue-700'}>
                                {size}
                              </span>
                              {selectedVariant.unitName && (
                                <span className={`text-xs ${isSelected ? 'text-white' : isOutOfStock ? 'text-gray-400' : 'text-blue-700'}`}>
                                  {selectedVariant.unitName}
                                </span>
                              )}
                              <span className={`text-xs mt-1 ${isOutOfStock ? 'text-red-500' : stock < 5 ? 'text-indigo-500' : 'text-green-600'}`}>
                                {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                                {realTimeUpdates.some(update => 
                                  update.data?.size === size && 
                                  (update.type === 'stock_updated' || update.type === 'inventory_assignment')
                                ) && (
                                  <span className="ml-1 text-blue-500 animate-pulse">●</span>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shipping Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTruck className="text-blue-600" />
                    <p className="text-base font-semibold text-gray-800">Shipping:</p>
                  </div>
                  <p className="text-gray-700 font-medium">
                    {shippingLoading ? (
                      <span className="text-gray-500">Loading shipping options...</span>
                    ) : (
                      getShippingSummary()
                    )}
                  </p>
                  {shippingLoading ? (
                    <div className="mt-2 text-sm text-gray-500">
                      Loading shipping details...
                    </div>
                  ) : getShippingOptions().length > 0 ? (
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      {getShippingOptions().map((opt, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {opt.name} — BDT{Number(opt.charge).toFixed(2)} • {opt.estimatedDays} days
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">
                      No shipping options available
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold px-6 py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Add to Cart
                  </button>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-white border border-blue-500 text-blue-600 text-lg font-bold px-6 py-4 rounded-xl hover:bg-blue-50 transition-all duration-200"
                      disabled
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-2 px-4 py-4 rounded-xl border transition-all duration-200 bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                      title="Like this product"
                    >
                      <FaHeart size={20} className="hover:text-red-500 transition" />
                      <span className="text-sm font-semibold">{likesCount}</span>
                    </button>
                    {isLoggedIn && (
                      <button
                        onClick={async () => {
                          const res = await toggleWish(id);
                          setIsWishlisted(res);
                        }}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          isWishlisted 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                        }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    )}
                    <button className="p-4 rounded-xl bg-white text-gray-600 border border-gray-300 hover:border-indigo-300 transition-all duration-200">
                      <FaShare size={20} />
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FaTruck className="text-2xl text-blue-600" />
                    <span className="text-xs text-gray-600">Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <FaShieldAlt className="text-2xl text-blue-600" />
                    <span className="text-xs text-gray-600">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <FaUndo className="text-2xl text-blue-600" />
                    <span className="text-xs text-gray-600">Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Related Products */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Related Products</h2>
                <div className="space-y-4">
                  {relatedProducts.length > 0 ? (
                    relatedProducts
                      .filter((relatedProduct) => relatedProduct.productId !== product._id)
                      .slice(0, 4)
                      .map((relatedProduct) => (
                        <Link
                          to={`/products/${relatedProduct.productId}`}
                          key={relatedProduct.productId}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <img
                            src={relatedProduct.mainImage}
                            alt={relatedProduct.name}
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200 group-hover:border-indigo-300 transition-colors"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {relatedProduct.name}
                            </h3>
                            <p className="text-sm text-blue-600 font-bold">BDT{relatedProduct.mainPrice}</p>
                          </div>
                          {relatedProduct.mainBadgeName && relatedProduct.mainBadgeColor && (
                            <Badge
                              name={relatedProduct.mainBadgeName}
                              color={relatedProduct.mainBadgeColor}
                              position="topRight"
                            />
                          )}
                        </Link>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No related products available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          {selectedVariant?.specifications && selectedVariant.specifications.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVariant.specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{spec.name}:</span>
                    <span className="text-gray-900">{spec.value} {spec.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Description */}
          {selectedVariant?.description && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Product Details</h2>
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedVariant.description }} />
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaStar className="text-blue-500" />
                <span>{product.totalReviews || 0} reviews • {product.averageRating || 0} rating</span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review this product!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-800">
                        {r.user?.firstName ? `${r.user.firstName} ${r.user?.lastName || ''}` : r.user?.email || 'User'}
                      </div>
                      <div className="flex items-center gap-1 text-blue-500">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} size={14} className={i < r.rating ? 'text-blue-500' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words">{r.comment}</p>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                    
                    {/* Review Actions */}
                    {(() => {
                      const token = localStorage.getItem('accessToken');
                      let canEdit = false;
                      try {
                        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
                        canEdit = payload && (payload.userId === (r.user?._id || r.user));
                      } catch {}
                      return canEdit ? (
                        <div className="flex gap-2 mt-3">
                          <button
                            className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            onClick={() => {
                              setRating(r.rating);
                              setComment(r.comment || '');
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            onClick={async () => {
                              try {
                                const t = localStorage.getItem('accessToken');
                                if (!t) { toast.error('Login required'); return; }
                                await axios.delete(`${import.meta.env.VITE_API_URI}/api/products/${id}/reviews/${r._id}`, {
                                  headers: { Authorization: `Bearer ${t}` }
                                });
                                fetchReviews();
                                toast.success('Review deleted successfully!', { position: 'top-center', autoClose: 1500, hideProgressBar: true });
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Delete failed', { position: 'top-center', autoClose: 2000, hideProgressBar: true });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))
              )}
            </div>

            {/* Add Review Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setRating(s)} 
                        className={`text-2xl transition-colors ${rating >= s ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  {rating > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          const t = localStorage.getItem('accessToken');
                          if (!t) { toast.error('Login required'); return; }
                          const payload = JSON.parse(atob(t.split('.')[1]));
                          const myRev = reviews.find(rv => (rv.user?._id || rv.user) === payload.userId);
                          if (!myRev) { toast.error('No existing review to update'); return; }
                          await axios.put(`${import.meta.env.VITE_API_URI}/api/products/${id}/reviews/${myRev._id}`, { rating, comment }, {
                            headers: { Authorization: `Bearer ${t}` }
                          });
                          setRating(0);
                          setComment('');
                          fetchReviews();
                          toast.success('Review updated successfully!', { position: 'top-center', autoClose: 1500, hideProgressBar: true });
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Update failed', { position: 'top-center', autoClose: 2000, hideProgressBar: true });
                        }
                      }}
                      className="px-6 py-3 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 transform hover:scale-105"
                    >
                      Update Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-500">Loading product details...</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ProductView;
