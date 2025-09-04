import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaSearch, 
  FaArrowLeft, 
  FaShoppingCart, 
  FaUser,
  FaExclamationTriangle,
  FaRocket,
  FaStar,
  FaHeart
} from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y <= -10 ? 110 : particle.y - particle.speed
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      icon: <FaHome className="text-2xl" />,
      title: "Go Home",
      description: "Return to homepage",
      action: () => navigate('/'),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <FaSearch className="text-2xl" />,
      title: "Browse Products",
      description: "Explore our collection",
      action: () => navigate('/products'),
      color: "from-green-500 to-green-600"
    },
    {
      icon: <FaShoppingCart className="text-2xl" />,
      title: "View Cart",
      description: "Check your cart",
      action: () => navigate('/cart'),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <FaUser className="text-2xl" />,
      title: "My Account",
      description: "Access your profile",
      action: () => navigate('/user'),
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Number with Animation */}
          <div className="relative mb-8">
            <div 
              className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse"
              style={{
                transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`
              }}
            >
              404
            </div>
            
            {/* Floating Elements Around 404 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute -top-4 -left-4 animate-bounce">
                <FaStar className="text-yellow-400 text-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <FaHeart className="text-red-400 text-3xl" />
              </div>
              <div className="absolute -bottom-4 -left-4 animate-bounce" style={{ animationDelay: '1s' }}>
                <FaRocket className="text-blue-400 text-3xl" />
              </div>
              <div className="absolute -bottom-4 -right-4 animate-bounce" style={{ animationDelay: '1.5s' }}>
                <FaStar className="text-purple-400 text-3xl" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaExclamationTriangle className="text-4xl text-orange-500 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Oops! Page Not Found
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The page you're looking for seems to have wandered off into the digital wilderness. 
              Don't worry, we'll help you find your way back!
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-6 py-4 pl-12 pr-20 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all duration-300"
                  onFocus={() => setIsHovered(true)}
                  onBlur={() => setIsHovered(false)}
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-medium">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={action.action}
                  className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors duration-300">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaArrowLeft />
              Go Back
            </button>
            
            <Link
              to="/"
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaHome />
              Back to Home
            </Link>
          </div>

          {/* Fun Facts Section */}
          <div className="mt-16 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Did You Know?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">404</span>
                </div>
                <p className="text-gray-700">
                  The 404 error was first introduced by the HTTP protocol in 1990
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaSearch className="text-white text-xl" />
                </div>
                <p className="text-gray-700">
                  Most 404 errors happen due to broken links or mistyped URLs
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaRocket className="text-white text-xl" />
                </div>
                <p className="text-gray-700">
                  Creative 404 pages can actually improve user experience
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default NotFound;
