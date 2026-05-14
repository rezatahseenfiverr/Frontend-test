// src/components/ProductCard.jsx

import React from "react";
import Badge from "./Badge";
import PropTypes from 'prop-types';
import { Link } from "react-router-dom";

const ProductCard = ({ Data, viewMode = "grid" }) => {
  const {
    _id,
    mainBadgeName,
    mainBadgeColor,
    mainImage,
    name,
    mainPrice,
    discountPrice,
    gender,
    categories
  } = Data;

  // Parse categories if needed
  let parsedCategories = [];
  if (Array.isArray(categories)) {
    categories.forEach(cat => {
      try {
        const arr = JSON.parse(cat);
        if (Array.isArray(arr)) {
          parsedCategories = parsedCategories.concat(arr);
        }
      } catch {
        parsedCategories.push(cat);
      }
    });
  }

  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-3 sm:gap-4 w-full group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6">
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src={mainImage}
              alt={name}
              className="w-full h-full object-contain p-2"
              loading="lazy"
            />
            {/* Main Badge Overlay */}
            {mainBadgeName && mainBadgeColor && (
              <Badge
                name={mainBadgeName}
                color={mainBadgeColor}
                position="topRight"
              />
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {name}
          </h2>

          {/* Categories */}
          {parsedCategories.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {parsedCategories.slice(0, 2).map((cat, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Gender */}
          {gender && (
            <p className="text-xs text-gray-500 mb-1">For: {gender}</p>
          )}

          {/* Product Price */}
          <div className="flex items-end gap-2 mb-2">
            {discountPrice ? (
              <>
                <span className="text-sm text-gray-400 line-through">BDT{mainPrice}</span>
                <span className="text-lg text-blue-700 font-bold">BDT{discountPrice}</span>
              </>
            ) : (
              <span className="text-lg text-blue-700 font-bold">BDT{mainPrice}</span>
            )}
          </div>
        </div>

        {/* View Details Button */}
        <div className="flex-shrink-0">
          <Link to={`/products/${_id}`}>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow transition-all duration-200 transform hover:scale-105 touch-target text-sm sm:text-base">
              View Details
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 relative flex flex-col group hover-lift">
      {/* Product Image */}
      <div className="relative flex items-center justify-center bg-white p-3 sm:p-4 h-48 sm:h-56">
        <img
          src={mainImage}
          alt={name}
          className="max-h-36 sm:max-h-44 object-contain mx-auto transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        {/* Main Badge Overlay */}
        {mainBadgeName && mainBadgeColor && (
          <Badge
            name={mainBadgeName}
            color={mainBadgeColor}
            position="topLeft"
          />
        )}
      </div>

      {/* Product Details */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col">
        {/* Product Name */}
        <h2 className="text-sm sm:text-base font-bold mb-1 text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {name}
        </h2>

        {/* Categories */}
        {parsedCategories.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {parsedCategories.slice(0, 2).map((cat, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Gender */}
        {gender && (
          <p className="text-xs text-gray-500 mb-1">For: {gender}</p>
        )}

        {/* Product Price */}
        <div className="flex items-end gap-2 mb-2">
          {discountPrice ? (
            <>
              <span className="text-xs sm:text-sm text-gray-400 line-through">BDT{mainPrice}</span>
              <span className="text-base sm:text-lg text-blue-700 font-bold">BDT{discountPrice}</span>
            </>
          ) : (
            <span className="text-base sm:text-lg text-blue-700 font-bold">BDT{mainPrice}</span>
          )}
        </div>

        {/* View Details Button */}
        <Link to={`/products/${_id}`}>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 rounded-lg shadow transition-all duration-200 mt-auto transform hover:scale-105 touch-target text-sm sm:text-base">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  Data: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    mainBadgeName: PropTypes.string,
    mainBadgeColor: PropTypes.string,
    mainImage: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    mainPrice: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    gender: PropTypes.string,
  }).isRequired,
  viewMode: PropTypes.oneOf(["grid", "list"]),
};

export default ProductCard;
