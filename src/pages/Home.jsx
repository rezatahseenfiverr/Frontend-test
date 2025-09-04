import React, { useState, useEffect } from 'react';
import HeroSection from "../components/HeroSection";
import Slider from "../components/Slider";
import ProductCard from "../components/ProductCard";
import StatsSection from "../components/StatsSection";
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

function Home() {
  const [topRatedSlides, setTopRatedSlides] = useState([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);

  useEffect(() => {
    const fetchTopRatedSlides = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/topratedslides`);
        setTopRatedSlides(response.data);
      } catch (error) {
        console.error('Error fetching top rated slides:', error);
      } finally {
        setTopRatedLoading(false);
      }
    };

    fetchTopRatedSlides();
  }, []);

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 py-12 sm:py-16 lg:py-20 xl:py-32">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative mx-auto max-w-7xl container-padding-mobile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Discover Amazing
                <span className="block text-yellow-200">Products</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
                Shop the latest trends with unbeatable prices. Quality products delivered to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link to="/products">
                  <button className="bg-white text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-yellow-100 transition-all duration-300 transform hover:scale-105 shadow-lg touch-target">
                    Shop Now
                  </button>
                </Link>
                <Link to="/categories">
                  <button className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 touch-target">
                    Browse Categories
                  </button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
                  <div className="text-center text-white">
                    <div className="text-4xl sm:text-6xl mb-4">🛍️</div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Special Offers</h3>
                    <p className="text-base sm:text-lg">Up to 70% off on selected items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-7xl container-padding-mobile">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Shop by Category
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>
          <HeroSection />
        </div>
      </section>

      {/* Top Rated Products Section */}
      {topRatedSlides.length > 0 && (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="mx-auto max-w-7xl container-padding-mobile">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center">
                <FaStar className="text-yellow-500 mr-2 sm:mr-3 text-2xl sm:text-3xl" />
                Top Rated Products
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Our highest-rated products loved by customers
              </p>
            </div>
            
            {topRatedLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {topRatedSlides.map((slide) => (
                  <div key={slide._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="relative">
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.name}
                        className="w-full h-40 sm:h-48 object-contain bg-gray-50"
                      />
                      {slide.mainBadgeName && (
                        <div 
                          className="absolute top-2 left-2 px-2 sm:px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: slide.mainBadgeColor || '#f59e0b' }}
                        >
                          {slide.mainBadgeName}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <FaStar className="mr-1" />
                        {slide.rating || 0}
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{slide.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base sm:text-lg font-bold text-gray-900">BDT{slide.price}</span>
                        {slide.discountPrice && slide.discountPrice < slide.price && (
                          <span className="text-xs sm:text-sm text-gray-500 line-through">BDT{slide.discountPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <span>{slide.totalReviews || 0} reviews</span>
                        <Link 
                          to={`/products/${slide.productId}`}
                          className="text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Special Offers Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-yellow-400 to-orange-500">
        <div className="mx-auto max-w-7xl container-padding-mobile">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Special Offers
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Don't miss out on these incredible deals
            </p>
          </div>
          <Slider />
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Why Choose Us Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-7xl container-padding-mobile">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose Us
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to providing the best shopping experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover-lift">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚚</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-sm sm:text-base text-gray-600">Free shipping on orders over $50. Get your products delivered within 2-3 business days.</p>
            </div>
            
            <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover-lift">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🛡️</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Quality Guarantee</h3>
              <p className="text-sm sm:text-base text-gray-600">All our products are carefully selected and quality-tested to ensure customer satisfaction.</p>
            </div>
            
            <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover-lift">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💬</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm sm:text-base text-gray-600">Our customer support team is available round the clock to help you with any questions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;