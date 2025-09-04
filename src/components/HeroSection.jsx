import React from 'react';
import { Link } from 'react-router-dom';

function HeroSection() {
  const categories = [
    { name: "Electronics", icon: "📱", color: "from-blue-500 to-blue-600", link: "/products?category=electronics" },
    { name: "Fashion", icon: "👕", color: "from-pink-500 to-pink-600", link: "/products?category=fashion" },
    { name: "Home & Garden", icon: "🏠", color: "from-green-500 to-green-600", link: "/products?category=home" },
    { name: "Sports", icon: "⚽", color: "from-purple-500 to-purple-600", link: "/products?category=sports" },
    { name: "Books", icon: "📚", color: "from-indigo-500 to-indigo-600", link: "/products?category=books" },
    { name: "Toys", icon: "🎮", color: "from-red-500 to-red-600", link: "/products?category=toys" },
    { name: "Health & Beauty", icon: "💄", color: "from-rose-500 to-rose-600", link: "/products?category=beauty" },
    { name: "Automotive", icon: "🚗", color: "from-gray-500 to-gray-600", link: "/products?category=automotive" },
    { name: "Music", icon: "🎵", color: "from-yellow-500 to-yellow-600", link: "/products?category=music" },
    { name: "Office", icon: "💼", color: "from-teal-500 to-teal-600", link: "/products?category=office" },
    { name: "Gaming", icon: "🎮", color: "from-orange-500 to-orange-600", link: "/products?category=gaming" },
    { name: "Photography", icon: "📷", color: "from-cyan-500 to-cyan-600", link: "/products?category=photography" }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category, index) => (
          <Link
            key={index}
            to={category.link}
            className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative p-4 text-center">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                {category.name}
              </h3>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${category.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
          </Link>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Link to="/products">
          <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
            View All Categories
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </Link>
      </div>
    </div>
  );
}

export default HeroSection;