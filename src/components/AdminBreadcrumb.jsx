import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminBreadcrumb = () => {
  const location = useLocation();
  
  // Admin-specific route mapping
  const getRouteInfo = (path) => {
    const routeMap = {
      'dashboard': 'Dashboard',
      'products': 'Products',
      'users': 'Users',
      'orders': 'Orders',
      'categories': 'Categories',
      'inventory': 'Inventory',
      'shipping': 'Shipping',
      'coupons': 'Coupons',
      'contacts': 'Contacts',
      'slides': 'Sliders',
      'top-rated': 'Top Rated',
      'colors': 'Colors',
      'sizes': 'Sizes',
      'gender': 'Genders',
      'measure-type': 'Measure Types',
      'badges': 'Badges',
      'profile': 'Profile',
      'admins': 'Admin Management',
      'createproducts': 'Create Product',
      'related': 'Related Products',
      'inbox': 'Messages',
      'pos': 'Point of Sale',
      'pos-orders': 'POS Orders'
    };
    
    return routeMap[path] || path.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Function to generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];

    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Skip 'admin' as it's already handled
      if (name === 'admin') return;
      
      const routeName = getRouteInfo(name);
      
      breadcrumbs.push({
        name: routeName,
        path: currentPath,
        icon: null
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on admin login page
  if (location.pathname === '/admin') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-3">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path}>
              {index > 0 && (
                <span className="text-gray-600">{'>'}</span>
              )}
              <Link
                to={breadcrumb.path}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-200 hover:text-indigo-600 ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 cursor-default'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
                onClick={index === breadcrumbs.length - 1 ? (e) => e.preventDefault() : undefined}
              >
                {breadcrumb.icon && <span>{breadcrumb.icon}</span>}
                <span>{breadcrumb.name}</span>
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default AdminBreadcrumb;
