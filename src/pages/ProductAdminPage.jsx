// src/pages/ProductAdminPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const ProductAdminPage = () => {
  const menuItems = [
    { name: 'Products', icon: '🛍️' },
    { name: 'Categories', icon: '📦' },
    { name: 'Colors', icon: '🎨' },
    { name: 'Sizes', icon: '📏' },
    { name: 'Gender', icon: '👤' },
    { name: 'Badges', icon: '🏷️' },
    { name: 'Coupons', icon: '💸' },
    { name: 'Slides', icon: '🖼️' },
    { name: 'Top Rated', icon: '⭐' },
    { name: 'Related', icon: '🔗' },
    { name: 'Shipping', icon: '🚚' },

    // New Measure Type menu item
    { name: 'Measure Type', icon: '📐' },
  ];

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 sm:ml-64">
      <h1 className="text-3xl sm:text-4xl font-bold my-8 text-center">Choose one</h1>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mb-8 w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={`./${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex flex-col justify-center items-center bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 cursor-pointer transition-all duration-200"
            >
              <span className="text-4xl mb-2">{item.icon}</span>
              <span className="text-lg sm:text-xl text-center">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductAdminPage;
