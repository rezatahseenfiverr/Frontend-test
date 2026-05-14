import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaArrowLeft } from 'react-icons/fa';
import { UserContext } from '../context/UserContext';

const WishlistPage = () => {
  const { wishlist, fetchWishlist, toggleWishlist } = useContext(UserContext);
  const [items, setItems] = useState([]);

  useEffect(() => { fetchWishlist(); }, []);

  useEffect(() => {
    setItems(Array.isArray(wishlist) ? wishlist : []);
  }, [wishlist]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-lg hover:bg-gray-200 transition"><FaArrowLeft className="text-gray-700" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist ({items.length})</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <FaHeart className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Your wishlist is empty</p>
            <Link to="/products" className="mt-4 inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition">Browse Products</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              if (!item || !item._id) return null;
              return (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                  <Link to={`/products/${item._id}`} className="flex-shrink-0">
                    <img src={item.mainImage || '/placeholder.png'} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" onError={(e) => { e.target.style.display = 'none'; }} />
                  </Link>
                  <Link to={`/products/${item._id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">BDT{item.discountPrice || item.mainPrice}</p>
                  </Link>
                  <button
                    onClick={async () => await toggleWishlist(item._id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                    title="Remove from wishlist"
                  >
                    <FaHeart className="fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
