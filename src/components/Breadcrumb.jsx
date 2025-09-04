import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const Breadcrumb = () => {
  const location = useLocation();
  
  // Function to generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [
      { name: 'Home', path: '/', icon: <FaHome className="text-yellow-500" /> }
    ];

    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Convert path to readable name
      let displayName = name;
      if (name === 'products') {
        displayName = 'Products';
      } else if (name === 'contact') {
        displayName = 'Contact Us';
      } else if (name === 'login') {
        displayName = 'Login';
      } else if (name === 'signup') {
        displayName = 'Sign Up';
      } else if (name === 'cart') {
        displayName = 'Shopping Cart';
      } else if (name === 'profile') {
        displayName = 'Profile';
      } else if (name === 'admin') {
        displayName = 'Admin Panel';
      } else {
        // Capitalize first letter and replace hyphens/underscores with spaces
        displayName = name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      breadcrumbs.push({
        name: displayName,
        path: currentPath,
        icon: null
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-3">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path}>
              {index > 0 && (
                <FaChevronRight className="text-gray-400 text-sm" />
              )}
              <Link
                to={breadcrumb.path}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-200 hover:text-yellow-600 ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 cursor-default'
                    : 'text-gray-600 hover:text-yellow-600'
                }`}
                onClick={index === breadcrumbs.length - 1 ? (e) => e.preventDefault() : undefined}
              >
                {breadcrumb.icon && <span className="text-sm">{breadcrumb.icon}</span>}
                <span>{breadcrumb.name}</span>
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumb;
