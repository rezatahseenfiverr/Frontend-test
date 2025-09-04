import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { FaFilter, FaTimes, FaSearch, FaSort, FaTh, FaListUl, FaChevronDown, FaChevronUp } from "react-icons/fa";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    price: true,
    sort: true,
    category: true,
    gender: true
  });

  // Fetch all products initially
  const getProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
    setLoading(false);
  };

  // Fetch categories
  const getCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URI}/api/categories`);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  // Fetch genders
  const getGenders = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URI}/api/genders`);
      setGenders(data);
    } catch (error) {
      console.error("Error fetching genders", error);
    }
  };

  // Handle category checkbox change
  const handleCategoryChange = (categoryName) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryName)
        ? prevSelected.filter((c) => c !== categoryName)
        : [...prevSelected, categoryName]
    );
  };

  // Handle gender checkbox change
  const handleGenderChange = (genderName) => {
    setSelectedGenders((prevSelected) =>
      prevSelected.includes(genderName)
        ? prevSelected.filter((g) => g !== genderName)
        : [...prevSelected, genderName]
    );
  };

  // Handle price range change
  const handlePriceChange = (field, value) => {
    // Allow empty string or valid numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPriceRange(prev => ({ ...prev, [field]: value }));
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Apply filtering and sorting logic
  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        let productCategories = [];
        if (Array.isArray(product.categories)) {
          product.categories.forEach(cat => {
            try {
              const parsed = JSON.parse(cat);
              if (Array.isArray(parsed)) {
                productCategories = productCategories.concat(parsed);
              }
            } catch {
              productCategories.push(cat);
            }
          });
        }
        return productCategories.some((category) =>
          selectedCategories.includes(category)
        );
      });
    }

    // Filter by selected genders
    if (selectedGenders.length > 0) {
      filtered = filtered.filter((product) =>
        selectedGenders.includes(product.gender)
      );
    }

    // Filter by price range
    if (priceRange.min !== "" || priceRange.max !== "") {
      filtered = filtered.filter((product) => {
        const price = product.discountPrice || product.mainPrice;
        const min = priceRange.min !== "" ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max !== "" ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return (a.discountPrice || a.mainPrice) - (b.discountPrice || b.mainPrice);
        case "price-high":
          return (b.discountPrice || b.mainPrice) - (a.discountPrice || a.mainPrice);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [selectedCategories, selectedGenders, products, searchQuery, sortBy, priceRange]);

  // Fetch categories, genders, and products on component mount
  useEffect(() => {
    getCategories();
    getGenders();
    getProducts();
  }, []);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setSortBy("name");
  };

  const activeFiltersCount = selectedCategories.length + selectedGenders.length + 
    (priceRange.min !== "" ? 1 : 0) + (priceRange.max !== "" ? 1 : 0) + 
    (searchQuery.trim() !== "" ? 1 : 0);

  // Filter section component
  const FilterSection = ({ title, children, section, icon }) => (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {expandedSections[section] ? (
          <FaChevronUp className="text-gray-500" />
        ) : (
          <FaChevronDown className="text-gray-500" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto container-padding-mobile">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Discover Our Products
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Explore our wide range of high-quality products with amazing deals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto container-padding-mobile py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-1/4">
            {/* Mobile Filter Button */}
            <div className="lg:hidden flex items-center justify-between mb-4 sm:mb-6">
              <button
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 touch-target text-sm sm:text-base"
                onClick={() => setShowFilters(true)}
              >
                <FaFilter />
                Filters {activeFiltersCount > 0 && (
                  <span className="bg-white text-orange-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-105 touch-target ${
                    viewMode === "grid" 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
                  }`}
                >
                  <FaTh size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-105 touch-target ${
                    viewMode === "list" 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
                  }`}
                >
                  <FaListUl size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showFilters && (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                <div
                  className="flex-1 bg-black bg-opacity-50 backdrop-blur-sm"
                  onClick={() => setShowFilters(false)}
                />
                <div className="w-80 max-w-full bg-white shadow-2xl overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setShowFilters(false)}
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold transform hover:scale-105"
                      >
                        Clear All Filters ({activeFiltersCount})
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <FilterSection title="Search Products" section="search" icon={<FaSearch className="text-yellow-500" />}>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </FilterSection>

                    <FilterSection title="Price Range" section="price" icon={<span className="text-green-500">💰</span>}>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Min Price"
                            value={priceRange.min}
                            onChange={(e) => handlePriceChange('min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                          <input
                            type="text"
                            placeholder="Max Price"
                            value={priceRange.max}
                            onChange={(e) => handlePriceChange('max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        {(priceRange.min || priceRange.max) && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                            Price range: BDT{priceRange.min || '0'} - BDT{priceRange.max || '∞'}
                          </div>
                        )}
                      </div>
                    </FilterSection>

                    <FilterSection title="Sort By" section="sort" icon={<FaSort className="text-blue-500" />}>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="name">Name A-Z</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </FilterSection>

                    <FilterSection title="Categories" section="category" icon={<span className="text-purple-500">📂</span>}>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <label key={category._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 group">
                              <input
                                type="checkbox"
                                value={category.name}
                                checked={selectedCategories.includes(category.name)}
                                onChange={() => handleCategoryChange(category.name)}
                                className="mr-3 accent-yellow-500 transform scale-110"
                              />
                              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{category.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Loading categories...</p>
                        )}
                      </div>
                    </FilterSection>

                    <FilterSection title="Gender" section="gender" icon={<span className="text-pink-500">👥</span>}>
                      <div className="space-y-2">
                        {genders.length > 0 ? (
                          genders.map((gender) => (
                            <label key={gender._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 group">
                              <input
                                type="checkbox"
                                value={gender.type}
                                checked={selectedGenders.includes(gender.type)}
                                onChange={() => handleGenderChange(gender.type)}
                                className="mr-3 accent-yellow-500 transform scale-110"
                              />
                              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{gender.type}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Loading genders...</p>
                        )}
                      </div>
                    </FilterSection>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Clear ({activeFiltersCount})
                    </button>
                  )}
                </div>
                
                <FilterSection title="Search Products" section="search" icon={<FaSearch className="text-yellow-500" />}>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </FilterSection>

                <FilterSection title="Price Range" section="price" icon={<span className="text-green-500">💰</span>}>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Min Price"
                        value={priceRange.min}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                      <input
                        type="text"
                        placeholder="Max Price"
                        value={priceRange.max}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    {(priceRange.min || priceRange.max) && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        Price range: BDT{priceRange.min || '0'} - BDT{priceRange.max || '∞'}
                      </div>
                    )}
                  </div>
                </FilterSection>

                <FilterSection title="Sort By" section="sort" icon={<FaSort className="text-blue-500" />}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </FilterSection>

                <FilterSection title="Categories" section="category" icon={<span className="text-purple-500">📂</span>}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <label key={category._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 group">
                          <input
                            type="checkbox"
                            value={category.name}
                            checked={selectedCategories.includes(category.name)}
                            onChange={() => handleCategoryChange(category.name)}
                            className="mr-3 accent-yellow-500 transform scale-110"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{category.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Loading categories...</p>
                    )}
                  </div>
                </FilterSection>

                <FilterSection title="Gender" section="gender" icon={<span className="text-pink-500">👥</span>}>
                  <div className="space-y-2">
                    {genders.length > 0 ? (
                      genders.map((gender) => (
                        <label key={gender._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 group">
                          <input
                            type="checkbox"
                            value={gender.type}
                            checked={selectedGenders.includes(gender.type)}
                            onChange={() => handleGenderChange(gender.type)}
                            className="mr-3 accent-yellow-500 transform scale-110"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{gender.type}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Loading genders...</p>
                    )}
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          {/* Products List */}
          <main className="w-full lg:w-3/4">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Products ({filteredProducts.length})
                </h1>
                {activeFiltersCount > 0 && (
                  <p className="text-sm sm:text-base text-gray-600">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 touch-target ${
                    viewMode === "grid" 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
                  }`}
                >
                  <FaTh size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 touch-target ${
                    viewMode === "list" 
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
                  }`}
                >
                  <FaListUl size={16} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((info) => (
                  <Link to={`/products/${info._id}`} key={info._id} className="group">
                    <div className={viewMode === "list" ? "flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-lg p-3 sm:p-4 transition-all duration-300" : ""}>
                      <ProductCard Data={info} viewMode={viewMode} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg touch-target text-sm sm:text-base"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Products;
