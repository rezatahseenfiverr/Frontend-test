import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft, 
  FaSearch, 
  FaBarcode,
  FaQrcode,
  FaPrint,
  FaCamera,
  FaBox,
  FaClipboardList,
  FaTruck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaEye,
  FaDownload,
  FaUpload,
  FaWarehouse,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaCubes,
  FaListUl
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useAdmin } from '../context/AdminContext';
import QRScanner from '../components/QRScanner';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanMode, setScanMode] = useState('qr'); // 'qr' or 'barcode'
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableVariants, setAvailableVariants] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [variantStock, setVariantStock] = useState({});
  const [printQuantities, setPrintQuantities] = useState({});
  const [printSettings, setPrintSettings] = useState({
    printerType: 'normal', // 'normal', 'thermal'
    labelSize: 'medium', // 'small', 'medium', 'large'
    showQRCode: true, // Always true - QR codes are always shown
    showProductInfo: true,
    qrCodeType: 'qrCode', // Default to QR code only for better visibility
    qrCodeSize: 'medium' // 'small', 'medium', 'large'
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    productId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [formData, setFormData] = useState({
    productId: '',
    variantId: '',
    size: '',
    stockQuantity: 1, // Each inventory item is always 1 individual item
    price: 0,
    discountPrice: 0,
    manualPricing: false,
    location: {
      warehouse: 'Main Warehouse',
      shelf: '',
      section: ''
    },
    notes: ''
  });
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdmin();

  useEffect(() => {
    // Check if admin is authenticated
    if (!authLoading && !isAuthenticated) {
      toast.error('Please log in as admin to access this page');
      navigate('/admin');
      return;
    }
    
    if (isAuthenticated) {
      fetchInventory();
      fetchProducts();
      fetchOrders();
      fetchStats();
    }
  }, [pagination.page, filters, isAuthenticated, authLoading]);

  // Update available variants when product changes
  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p._id === formData.productId);
      setSelectedProduct(product);
      if (product && product.variants) {
        setAvailableVariants(product.variants);
      } else {
        setAvailableVariants([]);
      }
    } else {
      setSelectedProduct(null);
      setAvailableVariants([]);
    }
  }, [formData.productId, products]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/inventory?${params}`);

      setInventory(response.data.inventory);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch inventory');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/inventory/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllInventoryIds = async () => {
    try {
      // Fetch all inventory IDs with a large limit to get all items
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/inventory?limit=10000&page=1`);
      const allInventoryIds = response.data.inventory.map(item => item._id);
      setSelectedItems(allInventoryIds);
      toast.success(`All ${allInventoryIds.length} items selected`);
    } catch (error) {
      console.error('Error fetching all inventory IDs:', error);
      toast.error('Failed to select all items');
    }
  };

  const handleCreateInventory = async () => {
    try {
      if (bulkMode) {
        // Validate that at least one variant is selected
        if (selectedVariants.length === 0) {
          toast.error('Please select at least one variant');
          return;
        }

                // Create inventory for selected variants with individual stock quantities
        const bulkData = [];
        for (const variantId of selectedVariants) {
          const variant = availableVariants.find(v => v._id === variantId);
          if (variant && variant.sizes && variant.sizes.length > 0) {
            for (let i = 0; i < variant.sizes.length; i++) {
              const size = variant.sizes[i];
              const stockQuantity = variantStock[variantId]?.[size] || 0;
              if (stockQuantity > 0) {
                // Get the price and discount price for this specific size index
                const price = variant.prices?.[i] || variant.prices?.[0] || 0;
                const discountPrice = variant.discountPrices?.[i] || 0;
                
                bulkData.push({
                  productId: formData.productId,
                  variantId: variant._id,
                  size: size,
                  stockQuantity: stockQuantity,
                  price: price,
                  discountPrice: discountPrice,
                  location: formData.location,
                  notes: formData.notes
                });
              }
            }
          }
        }

        // Validate that at least one inventory item will be created
        if (bulkData.length === 0) {
          toast.error('Please set stock quantities for at least one size');
          return;
        }

        const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory/bulk`, {
          inventoryItems: bulkData
        });

        // Calculate total individual items that will be created
        const totalIndividualItems = bulkData.reduce((sum, item) => sum + item.stockQuantity, 0);
        toast.success(`Created ${totalIndividualItems} individual barcodes and QR codes for ${bulkData.length} variant/size combinations`);
      } else {
        // Create single inventory item
        const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory`, formData);

        toast.success('Inventory created successfully');
      }

      fetchInventory();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create inventory');
    }
  };

  const handleUpdateInventory = async () => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/inventory/${selectedInventory._id}`, formData);

      toast.success('Inventory updated successfully');
      fetchInventory();
      setShowModal(false);
      setSelectedInventory(null);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update inventory');
    }
  };

     const handleDeleteInventory = async (id) => {
     if (!window.confirm('Are you sure you want to delete this inventory item?')) {
       return;
     }

     try {
       await axios.delete(`${import.meta.env.VITE_API_URI}/api/inventory/${id}`);

       toast.success('Inventory deleted successfully');
       fetchInventory();
     } catch (error) {
       toast.error(error.response?.data?.message || 'Failed to delete inventory');
     }
   };

   const handleDeleteAllSelected = async () => {
     try {
       const deletePromises = selectedItems.map(id => 
         axios.delete(`${import.meta.env.VITE_API_URI}/api/inventory/${id}`)
       );
       
       await Promise.all(deletePromises);
       
       toast.success(`${selectedItems.length} inventory items deleted successfully`);
       setSelectedItems([]);
       fetchInventory();
     } catch (error) {
       toast.error('Failed to delete some inventory items');
       console.error('Error deleting inventory items:', error);
     }
   };

  const handleScanCode = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory/scan`, 
        { code: scannedCode }
      );

      setSelectedInventory(response.data.inventory);
      setShowScanModal(false);
      setShowModal(true);
      setScannedCode('');
    } catch (error) {
      toast.error('Code not found');
    }
  };

  const handleQRScan = async (scannedData) => {
    try {
      console.log('QR Scanner: Scanned data:', scannedData);
      
      // Try to find inventory by QR code or barcode
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory/scan`, 
        { code: scannedData }
      );

      setSelectedInventory(response.data.inventory);
      setShowQRScanner(false);
      setShowModal(true);
      toast.success(`Inventory item found! Product: ${response.data.inventory.productId?.name}`);
    } catch (error) {
      console.error('QR Scanner: Error scanning code:', error);
      toast.error(`Inventory item not found for code: ${scannedData}`);
      
      // Show the scanned data in the manual input modal for debugging
      setScannedCode(scannedData);
      setShowScanModal(true);
    }
  };

  const handleOpenQRScanner = (mode = 'qr') => {
    setScanMode(mode);
    setShowQRScanner(true);
  };

  const handleAssignToOrder = async (inventoryId, orderId, quantity) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory/assign`, 
        { inventoryId, orderId, quantity }
      );

      toast.success('Inventory assigned to order successfully');
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign inventory');
    }
  };

  const handlePrintCodes = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/inventory/print-codes`, 
        { 
          inventoryIds: selectedItems,
          quantities: printQuantities
        }
      );

      setShowPrintModal(true);
    } catch (error) {
      toast.error('Failed to generate print codes');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      variantId: '',
      size: '',
      stockQuantity: 1, // Each inventory item is always 1 individual item
      price: 0,
      discountPrice: 0,
      manualPricing: false,
      location: {
        warehouse: 'Main Warehouse',
        shelf: '',
        section: ''
      },
      notes: ''
    });
    setSelectedProduct(null);
    setAvailableVariants([]);
    setBulkMode(false);
    setSelectedVariants([]);
    setVariantStock({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'out_of_stock':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="text-green-600" />;
      case 'inactive':
        return <FaTimes className="text-gray-600" />;
      case 'out_of_stock':
        return <FaExclamationTriangle className="text-red-600" />;
      default:
        return <FaBox className="text-gray-600" />;
    }
  };

  const generatePrintContent = async () => {
    const content = [];
    
    // Flatten all codes from all selected items
    const allCodes = [];
    selectedItems.forEach(itemId => {
      const item = inventory.find(inv => inv._id === itemId);
      if (!item) return;
      
      const quantity = printQuantities[itemId] || item.stockQuantity;
      
      // Generate multiple codes based on quantity
      for (let i = 0; i < quantity; i++) {
        allCodes.push({
          productName: item.productId?.name,
          size: item.size,
          barcode: item.barcode,
          qrCode: item.qrCode, // Raw QR code string data
          colorName: item.color?.name,
          hexCode: item.color?.hexCode,
          variantImage: item.imageUri,
          price: item.price,
          discountPrice: item.discountPrice,
          showQRCode: true, // Always show QR codes
          showProductInfo: printSettings.showProductInfo
        });
      }
    });
    
    console.log('Generated print content with', allCodes.length, 'items');
    console.log('Sample QR code data:', allCodes[0]?.qrCode);
    console.log('Sample barcode data:', allCodes[0]?.barcode);
    
    if (printSettings.printerType === 'thermal') {
      // For thermal printer, create horizontal layout with multiple items per page
      let itemsPerPage;
      switch (printSettings.labelSize) {
        case 'small':
          itemsPerPage = 8; // 4x2 grid for thermal
          break;
        case 'large':
          itemsPerPage = 4; // 2x2 grid for thermal
          break;
        default: // medium
          itemsPerPage = 6; // 3x2 grid for thermal
      }
      
      // Split into pages for thermal printing
      for (let i = 0; i < allCodes.length; i += itemsPerPage) {
        const pageItems = allCodes.slice(i, i + itemsPerPage).map((code, pageIndex) => ({
          ...code,
          generatedCode: codes[i + pageIndex] || null
        }));
        content.push(pageItems);
      }
    } else {
      // For normal printer, calculate items per page based on label size
      let itemsPerPage;
      switch (printSettings.labelSize) {
        case 'small':
          itemsPerPage = 48; // 8x6 grid
          break;
        case 'large':
          itemsPerPage = 20; // 5x4 grid
          break;
        default: // medium
          itemsPerPage = 32; // 8x4 grid
      }
      
      // Split into pages
      for (let i = 0; i < allCodes.length; i += itemsPerPage) {
        const pageItems = allCodes.slice(i, i + itemsPerPage);
        content.push(pageItems);
      }
    }
    
    return { content };
  };

  // Generate code (barcode or QR code) for printing
  const generateCode = async (barcodeText, qrText) => {
    try {
      console.log('generateCode called with:', { barcodeText, qrText, qrCodeType: printSettings.qrCodeType });
      
      if (printSettings.qrCodeType === 'barcode') {
        // Generate SVG barcode
        const barcodeData = generateSVGBarcode(barcodeText, printSettings.printerType, printSettings.labelSize);
        console.log('Generated barcode, length:', barcodeData.length);
        return { 
          type: 'barcode', 
          data: barcodeData
        };
      } else if (printSettings.qrCodeType === 'qrCode') {
        // Generate QR code as SVG
        let qrTextFinal = qrText || 'NOQRCODE';
        
        // Determine size based on printer type and label size
        let qrSize;
        if (printSettings.printerType === 'thermal') {
          switch (printSettings.labelSize) {
            case 'small': qrSize = 12; break;
            case 'large': qrSize = 18; break;
            default: qrSize = 14; // medium
          }
        } else {
          switch (printSettings.labelSize) {
            case 'small': qrSize = 14; break;
            case 'large': qrSize = 20; break;
            default: qrSize = 16; // medium
          }
        }

        // Force QR code generation with multiple fallbacks
        try {
          console.log('Generating QR code SVG for:', qrTextFinal, 'with size:', qrSize);
          const svgString = await QRCode.toString(qrTextFinal, {
            type: 'svg',
            width: qrSize,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          console.log('QR code SVG generated successfully, length:', svgString.length);
          return { type: 'qr', data: svgString };
        } catch (qrError) {
          console.error('QR Code SVG generation error:', qrError);
          console.log('Using fallback QR code SVG generator');
          // Fallback to simple QR code SVG generator
          const fallbackData = generateSimpleQRCode(qrTextFinal, qrSize);
          console.log('Fallback QR code SVG generated, length:', fallbackData.length);
          return { 
            type: 'qr', 
            data: fallbackData
          };
        }
      } else {
        // Generate both barcode and QR code as SVG
        const barcodeSVG = generateSVGBarcode(barcodeText, printSettings.printerType, printSettings.labelSize);
        let qrTextFinal = qrText || 'NOQRCODE';
        
        let qrSize;
        if (printSettings.printerType === 'thermal') {
          switch (printSettings.labelSize) {
            case 'small': qrSize = 10; break;
            case 'large': qrSize = 16; break;
            default: qrSize = 12; // medium
          }
        } else {
          switch (printSettings.labelSize) {
            case 'small': qrSize = 12; break;
            case 'large': qrSize = 18; break;
            default: qrSize = 14; // medium
          }
        }

        try {
          console.log('Generating QR code SVG for combined type:', qrTextFinal, 'size:', qrSize);
          const qrSVG = await QRCode.toString(qrTextFinal, {
            type: 'svg',
            width: qrSize,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          console.log('QR code SVG generated successfully for combined type, length:', qrSVG.length);
          console.log('Barcode SVG length:', barcodeSVG.length);
          
          return { 
            type: 'both', 
            barcodeData: barcodeSVG, 
            qrData: qrSVG 
          };
        } catch (qrError) {
          console.error('QR Code SVG generation error for combined type:', qrError);
          console.log('Using fallback QR code SVG for combined type');
          const fallbackQR = generateSimpleQRCode(qrTextFinal, qrSize);
          console.log('Fallback QR code SVG generated for combined type, length:', fallbackQR.length);
          return { 
            type: 'both', 
            barcodeData: barcodeSVG, 
            qrData: fallbackQR
          };
        }
      }
    } catch (error) {
      console.error('Code generation error:', error);
      // Return error fallback
      if (printSettings.qrCodeType === 'barcode') {
        return { 
          type: 'barcode', 
          data: generateSVGBarcode('ERROR', printSettings.printerType, printSettings.labelSize)
        };
      } else if (printSettings.qrCodeType === 'qrCode') {
        return { 
          type: 'qr', 
          data: generateSimpleQRCode('ERROR', 20)
        };
      } else {
        return { 
          type: 'both', 
          barcodeData: generateSVGBarcode('ERROR', printSettings.printerType, printSettings.labelSize), 
          qrData: generateSimpleQRCode('ERROR', 20)
        };
      }
    }
  };

  // Force QR code generation for preview
  const forceQRCodeGeneration = async (qrText, size = 40) => {
    try {
      console.log('Force generating QR code for:', qrText);
      const qrCode = await generateSVGQRCode(qrText, size);
      console.log('Force QR code generated, length:', qrCode.length);
      return qrCode;
    } catch (error) {
      console.error('Force QR code generation failed:', error);
      return generateSimpleQRCode(qrText, size);
    }
  };

  // Generate barcode bars using realistic barcode pattern
  const generateBarcode = (text) => {
    if (!text || text.trim() === '') {
      return '<div style="width: 100%; height: 40px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #666;">No Barcode</div>';
    }

    // Create a realistic barcode pattern based on the text
    let pattern = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // Create varying bar widths based on character code
      const barCount = (charCode % 5) + 1; // 1-5 bars per character
      for (let j = 0; j < barCount; j++) {
        pattern += (j % 2 === 0) ? '█' : ' '; // Alternating bars and spaces
      }
    }
    
    // Ensure minimum length and add start/stop patterns
    if (pattern.length < 20) {
      pattern = '█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █';
    }
    
    // Create professional-looking barcode HTML
    let html = `
      <div style="
        width: 100%; 
        height: 60px; 
        background: white; 
        border: 1px solid #ddd; 
        border-radius: 4px;
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        padding: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        font-family: 'Courier New', monospace;
      ">
        <!-- Barcode bars -->
        <div style="
          display: flex;
          align-items: stretch;
          height: 40px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        ">
    `;
    
    // Generate individual bars with varying widths
    const bars = pattern.split('').filter(char => char === '█' || char === ' ');
    bars.forEach((bar, index) => {
      const isBlack = bar === '█';
      const width = isBlack ? '2px' : '1px';
      const backgroundColor = isBlack ? '#000000' : '#ffffff';
      const border = isBlack ? 'none' : '1px solid #eee';
      
      html += `
        <div style="
          width: ${width};
          background-color: ${backgroundColor};
          border: ${border};
          height: 100%;
          margin: 0 0.5px;
        "></div>
      `;
    });
    
    html += `
        </div>
        
        <!-- Barcode text -->
        <div style="
          font-size: 9px; 
          font-weight: bold; 
          color: #333; 
          text-align: center;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        ">${text}</div>
      </div>
    `;
    
    return html;
  };

  // Generate QR code as SVG string (async for print)
  const generateSVGQRCode = async (text, size = 20) => {
    if (!text || text.trim() === '') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
          <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#qrGradient)" stroke="#e9ecef" stroke-width="1" rx="4"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" font-size="${size/4}" fill="#ffffff" font-weight="600">QR</text>
        <text x="${size/2}" y="${size-2}" text-anchor="middle" font-size="${size/8}" fill="#ffffff" opacity="0.8">No Data</text>
      </svg>`;
    }

    try {
      console.log('Generating QR code for text:', text, 'size:', size);
      const svgString = await QRCode.toString(text, {
        type: 'svg',
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      console.log('QR code generated successfully, length:', svgString.length);
      return svgString;
    } catch (error) {
      console.error('QR Code SVG generation error:', error);
      console.log('Falling back to simple QR code generator');
      return generateSimpleQRCode(text, size);
    }
  };

  // Generate QR code as SVG string (sync for preview)
  const generateSVGQRCodeSync = (text, size = 20) => {
    if (!text || text.trim() === '') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1" rx="2"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" font-size="${size/4}" fill="#6c757d" font-weight="600">QR</text>
        <text x="${size/2}" y="${size-2}" text-anchor="middle" font-size="${size/8}" fill="#adb5bd">No Data</text>
      </svg>`;
    }

    // For preview, use the simple QR code generator
    return generateSimpleQRCode(text, size);
  };

  // Generate beautiful QR code SVG (fallback)
  const generateSimpleQRCode = (text, size = 20) => {
    if (!text || text.trim() === '') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
          <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#qrGradient)" stroke="#e9ecef" stroke-width="1" rx="4"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" font-size="${size/4}" fill="#ffffff" font-weight="600">QR</text>
        <text x="${size/2}" y="${size-2}" text-anchor="middle" font-size="${size/8}" fill="#ffffff" opacity="0.8">No Data</text>
      </svg>`;
    }

    // Create a more sophisticated QR-like pattern with better visual appeal
    const pattern = [];
    const gridSize = 9; // Larger grid for better detail
    for (let i = 0; i < gridSize; i++) {
      pattern[i] = [];
      for (let j = 0; j < gridSize; j++) {
        const charIndex = (i * gridSize + j) % text.length;
        const charCode = text.charCodeAt(charIndex);
        pattern[i][j] = (charCode + i + j) % 2 === 0;
      }
    }

    const margin = size * 0.1; // 10% margin
    const patternSize = size - (2 * margin);
    const cellSize = patternSize / gridSize;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    
    // Add beautiful gradient background
    svg += `<defs>
      <linearGradient id="qrBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#f8f9fa;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="qrCellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2c3e50;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#34495e;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" />
      </linearGradient>
      <filter id="qrShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="0.5" flood-color="#000000" flood-opacity="0.2"/>
      </filter>
    </defs>`;
    
    // Add beautiful background with rounded corners and shadow
    svg += `<rect width="${size}" height="${size}" fill="url(#qrBgGradient)" stroke="#e9ecef" stroke-width="1" rx="4" filter="url(#qrShadow)"/>`;
    
    // Draw QR pattern with enhanced styling
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (pattern[i][j]) {
          const x = margin + (j * cellSize);
          const y = margin + (i * cellSize);
          
          // Create varying colors based on position
          const colorVariations = ['#2c3e50', '#34495e', '#1a252f', '#2c3e50', '#34495e'];
          const cellColor = colorVariations[(i + j) % colorVariations.length];
          
          // Add subtle shadow effect
          svg += `<rect x="${x + 0.2}" y="${y + 0.2}" width="${cellSize - 0.4}" height="${cellSize - 0.4}" fill="#000000" opacity="0.3" rx="1"/>`;
          
          // Main cell with gradient
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="url(#qrCellGradient)" rx="1.5" filter="url(#qrShadow)"/>`;
          
          // Add highlight effect
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize * 0.3}" fill="#ffffff" opacity="0.2" rx="1.5"/>`;
        }
      }
    }
    
    // Add corner markers for better QR code recognition
    const markerSize = cellSize * 2;
    const markerPositions = [
      [margin, margin],
      [margin + patternSize - markerSize, margin],
      [margin, margin + patternSize - markerSize]
    ];
    
    markerPositions.forEach(([x, y]) => {
      // Outer square
      svg += `<rect x="${x}" y="${y}" width="${markerSize}" height="${markerSize}" fill="url(#qrCellGradient)" rx="2" filter="url(#qrShadow)"/>`;
      // Inner square
      svg += `<rect x="${x + markerSize * 0.25}" y="${y + markerSize * 0.25}" width="${markerSize * 0.5}" height="${markerSize * 0.5}" fill="#ffffff" rx="1"/>`;
      // Center square
      svg += `<rect x="${x + markerSize * 0.375}" y="${y + markerSize * 0.375}" width="${markerSize * 0.25}" height="${markerSize * 0.25}" fill="url(#qrCellGradient)" rx="0.5"/>`;
    });
    
    // Add subtle inner border
    svg += `<rect x="${margin}" y="${margin}" width="${patternSize}" height="${patternSize}" fill="none" stroke="#e9ecef" stroke-width="0.5" rx="2"/>`;
    
    svg += '</svg>';
    return svg;
  };

  // Generate beautiful SVG barcode for printing (without text)
  const generateSVGBarcode = (text, printerType = 'normal', labelSize = 'medium') => {
    if (!text || text.trim() === '') {
      const width = printerType === 'thermal' ? 80 : 100;
      const height = printerType === 'thermal' ? 20 : 25;
      return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1" rx="2"/>
        <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial" font-size="6" fill="#6c757d">No Barcode</text>
      </svg>`;
    }

    // Create a more realistic and beautiful barcode pattern that fills the container
    const barCount = Math.min(text.length * 6, 48); // More bars to fill space
    const baseBarWidth = printerType === 'thermal' ? 1.0 : 1.5;
    const barHeight = printerType === 'thermal' ? 18 : 24;
    const spacing = printerType === 'thermal' ? 0.2 : 0.6;
    
    let bars = [];
    for (let i = 0; i < barCount; i++) {
      const charIndex = i % text.length;
      const charCode = text.charCodeAt(charIndex);
      // Create varying bar widths to fill space better
      const barWidth = baseBarWidth + ((charCode % 5) * 0.4) + (Math.sin(i * 0.3) * 0.3);
      const isBlack = (charCode + i + Math.floor(i / 2)) % 2 === 0;
      bars.push({ width: barWidth, isBlack });
    }
    
    const totalWidth = bars.reduce((sum, bar) => sum + bar.width + spacing, 0);
    const svgWidth = totalWidth + 16; // Reduced padding to fill more space
    const svgHeight = barHeight + 6; // Reduced padding

    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
    
    // Add enhanced background gradient
    svg += `<defs>
      <linearGradient id="barcodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#fafbfc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f8f9fa;stop-opacity:1" />
      </linearGradient>
      <filter id="barcodeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.15"/>
      </filter>
      <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#2c3e50;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
      </linearGradient>
    </defs>`;
    
    // Add background with rounded corners
    svg += `<rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" fill="url(#barcodeGradient)" stroke="#e9ecef" stroke-width="1" rx="4"/>`;
    
    // Draw beautiful barcode bars that fill the space
    let x = 8;
    bars.forEach((bar, index) => {
      if (bar.isBlack) {
        // Create gradient colors for bars
        const barColors = ['#000000', '#1a1a1a', '#2c3e50', '#34495e', '#2c3e50', '#1a1a1a'];
        const barColor = barColors[index % barColors.length];
        
        // Add enhanced shadow effect
        svg += `<rect x="${x + 0.3}" y="3.3" width="${bar.width}" height="${barHeight}" fill="#000000" opacity="0.4" rx="0.5"/>`;
        
        // Main bar with gradient and enhanced styling
        svg += `<rect x="${x}" y="3" width="${bar.width}" height="${barHeight}" fill="url(#barGradient)" rx="0.8" filter="url(#barcodeShadow)"/>`;
        
        // Add enhanced highlight
        svg += `<rect x="${x}" y="3" width="${bar.width}" height="3" fill="#ffffff" opacity="0.3" rx="0.8"/>`;
        
        // Add subtle inner shadow
        svg += `<rect x="${x + 0.5}" y="3.5" width="${bar.width - 1}" height="${barHeight - 1}" fill="none" stroke="#000000" stroke-width="0.5" opacity="0.2" rx="0.5"/>`;
      }
      x += bar.width + spacing;
    });
    
    // Add enhanced start and stop patterns (guard bars)
    const startX = 4;
    const stopX = x - 2;
    svg += `<rect x="${startX}" y="3" width="3" height="${barHeight}" fill="url(#barGradient)" rx="1" filter="url(#barcodeShadow)"/>`;
    svg += `<rect x="${startX}" y="3" width="3" height="3" fill="#ffffff" opacity="0.4" rx="1"/>`;
    svg += `<rect x="${stopX}" y="3" width="3" height="${barHeight}" fill="url(#barGradient)" rx="1" filter="url(#barcodeShadow)"/>`;
    svg += `<rect x="${stopX}" y="3" width="3" height="3" fill="#ffffff" opacity="0.4" rx="1"/>`;
    
    // Add center pattern for better visual appeal
    const centerX = svgWidth / 2 - 1;
    svg += `<rect x="${centerX}" y="3" width="2" height="${barHeight}" fill="#000000" opacity="0.8" rx="0.5"/>`;
    
    svg += '</svg>';
    return svg;
  };

  const printCodes = async (printContent, codes = []) => {
    const printWindow = window.open('', '_blank');

    console.log('PrintCodes: Starting print generation');
    console.log('PrintCodes: Print content pages:', printContent.length);
    console.log('PrintCodes: QR Code Type setting:', printSettings.qrCodeType);
    
    // Generate codes directly in the HTML template
    let globalCodeIndex = 0;

    try {
      let globalCodeIndex = 0;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Codes</title>
            <style>
              @media print {
                @page {
                  margin: ${printSettings.printerType === 'thermal' ? '0.1in' : '0.3in'};
                  size: ${printSettings.printerType === 'thermal' ? '80mm 60mm landscape' : 'A4'};
                }
                .page { 
                  page-break-after: always; 
                  page-break-inside: avoid;
                }
                .page:last-child { page-break-after: avoid; }
                body { 
                  margin: 0; 
                  padding: 0;
                }
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: ${printSettings.printerType === 'thermal' ? '2px' : '8px'};
                font-size: ${printSettings.printerType === 'thermal' ? '6px' : '8px'};
                background: #f8f9fa;
              }
              .page {
                background: white;
                border: ${printSettings.printerType === 'thermal' ? 'none' : '1px solid #e0e0e0'};
                border-radius: ${printSettings.printerType === 'thermal' ? '0' : '4px'};
                padding: ${printSettings.printerType === 'thermal' ? '2px' : '8px'};
                margin-bottom: ${printSettings.printerType === 'thermal' ? '0' : '10px'};
                box-shadow: ${printSettings.printerType === 'thermal' ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'};
                min-height: ${printSettings.printerType === 'thermal' ? '100%' : '11in'};
                width: ${printSettings.printerType === 'thermal' ? '100%' : 'auto'};
                display: ${printSettings.printerType === 'thermal' ? 'grid' : 'grid'};
                grid-template-columns: ${printSettings.printerType === 'thermal' ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))'};
                gap: ${printSettings.printerType === 'thermal' ? '1px' : '6px'};
                align-content: start;
              }
              .code-item {
                border: ${printSettings.printerType === 'thermal' ? '1px solid #e0e0e0' : '1px solid #e0e0e0'};
                border-radius: ${printSettings.printerType === 'thermal' ? '2px' : '3px'};
                padding: ${printSettings.printerType === 'thermal' ? '2px' : '4px'};
                text-align: center;
                break-inside: avoid;
                min-height: ${printSettings.printerType === 'thermal' ? '60px' : '80px'};
                width: ${printSettings.printerType === 'thermal' ? '100%' : 'auto'};
                display: flex;
                flex-direction: column;
                justify-content: ${printSettings.printerType === 'thermal' ? 'space-between' : 'space-between'};
                background: white;
                box-shadow: ${printSettings.printerType === 'thermal' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.05)'};
                position: relative;
                overflow: hidden;
              }
              .code-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, #007bff, #00d4ff);
              }
              .product-name {
                font-weight: 600;
                font-size: 9px;
                margin-bottom: 3px;
                word-break: break-word;
                color: #2c3e50;
                line-height: 1.1;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .size {
                font-size: 8px;
                color: #6c757d;
                margin-bottom: 2px;
                font-weight: 500;
                background: #f8f9fa;
                padding: 1px 4px;
                border-radius: 2px;
                display: inline-block;
                border: 1px solid #e9ecef;
              }
              .color-name {
                font-size: 8px;
                color: #495057;
                margin-bottom: 2px;
                font-weight: 500;
                text-transform: capitalize;
              }
              .color-swatch {
                width: 10px;
                height: 10px;
                border: 1px solid #dee2e6;
                border-radius: 50%;
                display: inline-block;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                background-color: var(--color-hex);
                margin-right: 2px;
              }

              .qr-code {
                width: ${printSettings.printerType === 'thermal' ? '25px' : '35px'};
                height: ${printSettings.printerType === 'thermal' ? '25px' : '35px'};
                margin: ${printSettings.printerType === 'thermal' ? '1px auto' : '3px auto'};
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: ${printSettings.printerType === 'thermal' ? 'none' : '1px solid #e0e0e0'};
                border-radius: ${printSettings.printerType === 'thermal' ? '0' : '3px'};
                padding: ${printSettings.printerType === 'thermal' ? '1px' : '2px'};
                box-shadow: ${printSettings.printerType === 'thermal' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'};
              }
              .qr-code svg {
                width: 100%;
                height: 100%;
                border-radius: 2px;
              }
              .barcode-container {
                width: 100%;
                margin: ${printSettings.printerType === 'thermal' ? '1px auto' : '3px auto'};
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: ${printSettings.printerType === 'thermal' ? 'none' : '1px solid #e0e0e0'};
                border-radius: ${printSettings.printerType === 'thermal' ? '0' : '3px'};
                padding: ${printSettings.printerType === 'thermal' ? '1px' : '4px'};
                box-shadow: ${printSettings.printerType === 'thermal' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'};
                min-height: ${printSettings.printerType === 'thermal' ? '25px' : '120px'};
              }
              .barcode-container svg {
                width: 100%;
                height: auto;
                border-radius: 2px;
                display: block;
              }
              .barcode-container div {
                max-width: 100%;
                height: auto;
                border-radius: 2px;
                display: block;
              }
              .quantity {
                font-size: 8px;
                color: #6c757d;
                margin-top: 2px;
                font-weight: 500;
                background: #e9ecef;
                padding: 1px 4px;
                border-radius: 2px;
                display: inline-block;
                border: 1px solid #dee2e6;
              }
              .page-header {
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #007bff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 5px;
              }
              .page-footer {
                text-align: center;
                font-size: 8px;
                color: #6c757d;
                margin-top: 8px;
                padding-top: 5px;
                border-top: 1px solid #e0e0e0;
              }
              .brand-logo {
                text-align: center;
                margin-bottom: 8px;
                padding: 4px;
              }
              .brand-logo img {
                height: 20px;
                width: auto;
                max-width: 100%;
                object-fit: contain;
              }
              .price-info {
                font-size: 8px;
                color: #28a745;
                font-weight: 500;
                margin: 2px 0;
              }
              .price-original {
                text-decoration: line-through;
                color: #6c757d;
                margin-right: 3px;
              }
              .inventory-id {
                font-size: 7px;
                color: #6c757d;
                background: #f8f9fa;
                padding: 1px 3px;
                border-radius: 2px;
                border: 1px solid #e9ecef;
                margin: 2px 0;
                font-family: 'Courier New', monospace;
              }
            </style>
          </head>
          <body>
                        ${printContent.map((page, pageIndex) => `
              <div class="page">
                ${printSettings.printerType === 'thermal' ? `
                  <!-- Thermal Label Layout - Compact Grid -->
                  <div class="brand-logo">
                    <img src="/Barvella.png" alt="Barvella" style="height: 15px; width: auto; margin: 0 auto; display: block;" />
                  </div>
                  ${page.map((code, codeIndex) => {
                    console.log(`Thermal: Processing item ${codeIndex}, QR data: ${code.qrCode}, Barcode data: ${code.barcode}`);
                    
                    // Generate QR code size based on settings
                    let qrSize;
                    if (printSettings.printerType === 'thermal') {
                      switch (printSettings.labelSize) {
                        case 'small': qrSize = 20; break;
                        case 'large': qrSize = 28; break;
                        default: qrSize = 24; // medium
                      }
                    } else {
                      switch (printSettings.labelSize) {
                        case 'small': qrSize = 24; break;
                        case 'large': qrSize = 32; break;
                        default: qrSize = 28; // medium
                      }
                    }
                    
                    return `
                    <div class="code-item">
                      ${code.showProductInfo ? `
                        <div>
                          <div class="product-name">${code.productName || 'Unknown Product'}</div>
                          <div class="size">Size: ${code.size || 'N/A'}</div>
                          ${code.colorName ? `
                            <div class="color-name">Color: ${code.colorName}</div>
                            <div class="color-info">
                              ${code.hexCode ? `<span class="color-swatch" style="--color-hex: ${code.hexCode}; background-color: ${code.hexCode};"></span>` : ''}
                              <span style="font-size: 5px;">${code.hexCode || ''}</span>
                            </div>
                          ` : ''}
                          ${code.price ? `
                            <div class="price-info">
                              ${code.discountPrice ? `
                                <span class="price-original">BDT${code.price}</span>
                                <span>BDT${code.discountPrice}</span>
                              ` : `
                                <span>BDT${code.price}</span>
                              `}
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}
                      
                      <div>
                        ${printSettings.qrCodeType === 'barcode' ? `
                          <div class="barcode-container">
                            ${generateSVGBarcode(code.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize)}
                          </div>
                        ` : printSettings.qrCodeType === 'qrCode' ? `
                          <div class="qr-code">
                            ${generateSVGQRCodeSync(code.qrCode || 'NOQRCODE', qrSize)}
                          </div>
                        ` : printSettings.qrCodeType === 'combined' ? `
                          <div class="barcode-container">
                            ${generateSVGBarcode(code.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize)}
                          </div>
                          <div class="qr-code">
                            ${generateSVGQRCodeSync(code.qrCode || 'NOQRCODE', qrSize)}
                          </div>
                        ` : ''}
                      </div>
                      
                      <div class="quantity">1</div>
                    </div>
                    `;
                  }).join('')}
                ` : `
                  <!-- Normal Printer Layout -->
                  <div class="brand-logo">
                    <img src="/Barvella.png" alt="Barvella" style="height: 20px; width: auto; margin: 0 auto; display: block;" />
                  </div>
                  <div class="page-header">Page ${pageIndex + 1} of ${printContent.length}</div>
                  ${page.map((code, codeIndex) => {
                    console.log(`Normal: Processing item ${codeIndex}, QR data: ${code.qrCode}, Barcode data: ${code.barcode}`);
                    
                    // Generate QR code size based on settings
                    let qrSize;
                    if (printSettings.printerType === 'thermal') {
                      switch (printSettings.labelSize) {
                        case 'small': qrSize = 20; break;
                        case 'large': qrSize = 28; break;
                        default: qrSize = 24; // medium
                      }
                    } else {
                      switch (printSettings.labelSize) {
                        case 'small': qrSize = 24; break;
                        case 'large': qrSize = 32; break;
                        default: qrSize = 28; // medium
                      }
                    }
                    
                    return `
                    <div class="code-item">
                      ${code.showProductInfo ? `
                        <div>
                          <div class="product-name">${code.productName || 'Unknown Product'}</div>
                          <div class="size">Size: ${code.size || 'N/A'}</div>
                          ${code.colorName ? `
                            <div class="color-name">Color: ${code.colorName}</div>
                            <div class="color-info">
                              ${code.hexCode ? `<span class="color-swatch" style="--color-hex: ${code.hexCode}; background-color: ${code.hexCode};"></span>` : ''}
                              <span style="font-size: 7px;">${code.hexCode || ''}</span>
                            </div>
                          ` : ''}
                          ${code.price ? `
                            <div class="price-info">
                              ${code.discountPrice ? `
                                <span class="price-original">BDT${code.price}</span>
                                <span>BDT${code.discountPrice}</span>
                              ` : `
                                <span>BDT${code.price}</span>
                              `}
                            </div>
                          ` : ''}

                        </div>
                      ` : ''}
                      <div>
                        ${printSettings.qrCodeType === 'barcode' ? `
                          <div style="margin: 5px 0;">
                            <div style="height: 20px; background: white; border: 1px solid #d1d5db; border-radius: 2px; display: flex; align-items: center; justify-content: center;">
                              ${generateSVGBarcode(code.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize)}
                            </div>
                          </div>
                        ` : printSettings.qrCodeType === 'qrCode' ? `
                          <div style="margin: 5px 0;">
                            <div style="display: flex; align-items: center; justify-content: center;">
                              <div style="background: white; padding: 1px; border: 1px solid #d1d5db; border-radius: 2px;">
                                ${generateSVGQRCodeSync(code.qrCode || 'NOQRCODE', qrSize)}
                              </div>
                            </div>
                          </div>
                        ` : printSettings.qrCodeType === 'combined' ? `
                          <div style="margin: 5px 0;">
                            <div style="height: 20px; background: white; border: 1px solid #d1d5db; border-radius: 2px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                              ${generateSVGBarcode(code.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize)}
                            </div>
                            <div style="display: flex; align-items: center; justify-content: center;">
                              <div style="background: white; padding: 1px; border: 1px solid #d1d5db; border-radius: 2px;">
                                ${generateSVGQRCodeSync(code.qrCode || 'NOQRCODE', qrSize)}
                              </div>
                            </div>
                          </div>
                        ` : ''}
                      </div>
                      <div class="quantity">1</div>
                    </div>
                  `}).join('')}
                  <div class="page-footer">
                    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                  </div>
                `}
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    } catch (error) {
      console.error('Error generating print content:', error);
      toast.error('Failed to generate print content');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <div className="flex items-center space-x-4">
            <img 
              src="/Barvella.png" 
              alt="Barvella" 
              className="h-12 w-auto object-contain"
            />
            <h1 className="text-3xl sm:text-4xl font-bold">Inventory Management</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white rounded-md shadow-sm">
            <FaSearch className="text-gray-400 ml-2" />
                             <input
                   type="text"
                   placeholder="Search inventory..."
                   value={filters.search}
                   onChange={(e) => handleFilterChange('search', e.target.value)}
                   className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                 />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenQRScanner('qr')}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              <FaQrcode className="mr-2" /> Scan QR
            </button>
            <button
              onClick={() => handleOpenQRScanner('barcode')}
              className="flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
            >
              <FaBarcode className="mr-2" /> Scan Barcode
            </button>
            <button
              onClick={() => setShowScanModal(true)}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              <FaCamera className="mr-2" /> Manual Input
            </button>
          </div>



          <button
            onClick={() => {
              setBulkMode(true);
              setShowModal(true);
            }}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            <FaCubes className="mr-2" /> Bulk Create
          </button>
                     <button
             onClick={() => {
               if (selectedItems.length > 0) {
                 setShowPrintModal(true);
               } else {
                 toast.info('Please select items to print');
               }
             }}
             className="flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
           >
             <FaPrint className="mr-2" /> Print Codes
           </button>
           <button
             onClick={() => {
               if (selectedItems.length > 0) {
                 if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected inventory items? This action cannot be undone.`)) {
                   handleDeleteAllSelected();
                 }
               } else {
                 toast.info('Please select items to delete');
               }
             }}
             className="flex items-center bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
           >
             <FaTrash className="mr-2" /> Delete All
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full max-w-7xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaBox className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeItems || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:bg-gray-50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalAvailable || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaWarehouse className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full max-w-7xl mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaClipboardList className="mr-2 text-blue-500" />
            Filter Inventory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select
                 value={filters.status}
                 onChange={(e) => handleFilterChange('status', e.target.value)}
                 className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                             <select
                 value={filters.productId}
                 onChange={(e) => handleFilterChange('productId', e.target.value)}
                 className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ search: '', status: '', productId: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="w-full max-w-7xl">
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-8 text-center">
              <FaBox className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                                         <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">
                       <div className="flex flex-col items-center space-y-1">
                                                   <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Select all items across all pages
                                fetchAllInventoryIds();
                              } else {
                                setSelectedItems([]);
                              }
                            }}
                            checked={selectedItems.length === pagination.total && pagination.total > 0}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                                                   <button
                            onClick={() => {
                              if (selectedItems.length === pagination.total) {
                                setSelectedItems([]);
                                toast.info('All items deselected');
                              } else {
                                // Fetch all inventory IDs across all pages
                                fetchAllInventoryIds();
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {selectedItems.length === pagination.total ? 'Deselect All' : 'Select All'}
                          </button>
                       </div>
                     </th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Product</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Variant/Size</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Individual Barcode/QR</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Stock</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Location</th>
                    <th className="py-3 px-4 border-b text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 border-b">
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(prev => [...prev, item._id]);
                            } else {
                              setSelectedItems(prev => prev.filter(id => id !== item._id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                                             <td className="py-3 px-4 font-medium text-gray-800">
                         <div className="flex items-center">
                           <img 
                             src={item.imageUri} 
                             alt={item.productId?.name}
                             className="w-10 h-10 object-cover rounded mr-3"
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                           <div className="w-10 h-10 bg-gray-100 rounded mr-3 flex items-center justify-center" style={{ display: (item.imageUri || item.productId?.mainImage) ? 'none' : 'flex' }}>
                             <FaBox className="text-gray-400 text-xs" />
                           </div>
                                                       <div>
                              <div className="font-semibold">{item.productId?.name}</div>
                              <div className="text-sm text-gray-600">
                                {item.discountPrice ? (
                                  <>
                                    <span className="line-through text-gray-400">BDT{item.price}</span>
                                    <span className="ml-2 text-green-600 font-medium">BDT{item.discountPrice}</span>
                                  </>
                                ) : (
                                  <span>BDT{item.price}</span>
                                )}
                              </div>
                            </div>
                         </div>
                       </td>
                                                                    <td className="py-3 px-4 text-gray-600">
                         <div className="flex items-center space-x-3">
                           
                           
                           
                           <div>
                             <div className="font-medium">{item.size}</div>
                             <div className="text-sm text-gray-500">
                               {item.color?.name || 'Default Color'}
                             </div>
                             {item.color?.hexCode && (
                               <div className="flex items-center space-x-1 mt-1">
                                 <div 
                                   className="w-3 h-3 rounded-full border border-gray-300"
                                   style={{ backgroundColor: item.color.hexCode }}
                                 ></div>
                                 <span className="text-xs text-gray-400">{item.color.hexCode}</span>
                               </div>
                             )}
                           </div>
                         </div>
                       </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="space-y-2">
                          <div>
                            {/* SVG Barcode */}
                            <div className="mt-1">
                              <div 
                                className="h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-2 shadow-sm"
                              >
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ 
                                    __html: generateSVGBarcode(item.barcode || 'NOBARCODE', 'normal', 'medium') 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            {/* QR Code */}
                            <div className="flex items-center justify-center">
                              <div className="bg-white p-2 border border-gray-300 rounded-lg shadow-sm">
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: generateSVGQRCodeSync(item.qrCode || 'NOQRCODE', 45) 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 text-center space-y-1">
                            <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200 font-mono">
                              {item.barcode}
                            </div>
                            <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200 font-mono">
                              {item.qrCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>
                          <div className="font-medium">1 Individual Item</div>
                          <div className="text-sm text-gray-500">Available: {item.availableQuantity}</div>
                          <div className="text-sm text-gray-500">Assigned: {item.assignedQuantity}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>
                          <div className="text-sm">{item.location?.warehouse}</div>
                          <div className="text-xs text-gray-500">
                            {item.location?.shelf && `Shelf: ${item.location.shelf}`}
                            {item.location?.section && `Section: ${item.location.section}`}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInventory(item);
                              setFormData({
                                productId: item.productId._id,
                                variantId: item.variantId,
                                size: item.size,
                                stockQuantity: item.stockQuantity,
                                price: item.price || 0,
                                discountPrice: item.discountPrice || 0,
                                manualPricing: true, // When editing, assume manual pricing since we're editing existing values
                                location: item.location,
                                notes: item.notes
                              });
                              setShowModal(true);
                            }}
                            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                          >
                            <FaEdit className="mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInventory(item._id)}
                            className="flex items-center bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                          <button
                            onClick={() => {
                              // Simulate scanning this item's QR code
                              handleQRScan(item.qrCode);
                            }}
                            className="flex items-center bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                            title="Quick scan this item"
                          >
                            <FaQrcode className="mr-1" /> Quick Scan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Inventory Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedInventory ? 'Edit Inventory' : 'Add New Inventory'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedInventory(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value, variantId: '', size: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  disabled={!!selectedInventory}
                >
                  <option value="" className="bg-white text-gray-900">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id} className="bg-white text-gray-900">
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Info Display */}
              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={selectedProduct.mainImage} 
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600">BDT{selectedProduct.mainPrice}</p>
                      <p className="text-xs text-gray-500">{availableVariants.length} variants available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Mode Toggle */}
              {selectedProduct && availableVariants.length > 0 && !selectedInventory && (
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkMode}
                      onChange={(e) => setBulkMode(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Create individual barcodes & QR codes
                    </span>
                  </label>
                                     <div className="text-xs text-gray-500">
                     (Each unit gets unique barcode & QR code)
                   </div>
                   {selectedVariants.length > 0 && (
                     <div className="text-xs text-blue-600 mt-1">
                       {selectedVariants.length} variant(s) selected
                     </div>
                   )}
                </div>
              )}

                             {/* Variant Selection (Single Mode) */}
               {selectedProduct && availableVariants.length > 0 && !bulkMode && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Variant & Size</label>
                   <select
                     value={formData.variantId}
                     onChange={(e) => {
                       const variant = availableVariants.find(v => v._id === e.target.value);
                       setFormData(prev => ({ 
                         ...prev, 
                         variantId: e.target.value,
                         size: variant ? variant.size : '',
                         price: variant ? (variant.prices?.[0] || variant.price || 0) : 0,
                         discountPrice: variant ? (variant.discountPrices?.[0] || 0) : 0
                       }));
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                     disabled={!!selectedInventory}
                   >
                     <option value="" className="bg-white text-gray-900">Select Variant</option>
                     {availableVariants.map((variant) => (
                       <option key={variant._id} value={variant._id} className="bg-white text-gray-900">
                         {variant.colorName || 'Default'} - {variant.sizes?.join(', ') || 'No sizes'} - BDT{variant.prices?.[0] || variant.price || 0} (Stock: {variant.stock || 0})
                       </option>
                     ))}
                   </select>
                   
                   {/* Selected Variant Preview */}
                   {formData.variantId && (
                     <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                       {(() => {
                         const selectedVariant = availableVariants.find(v => v._id === formData.variantId);
                         if (!selectedVariant) return null;
                         
                         return (
                           <div className="flex items-center space-x-3">
                                                           {/* Variant Image */}
                              <div className="w-16 h-16 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0">
                                {selectedVariant.images && selectedVariant.images.length > 0 ? (
                                  <img 
                                    src={selectedVariant.images[0].url || selectedVariant.images[0]} 
                                    alt={selectedVariant.colorName || 'Variant'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: selectedVariant.images && selectedVariant.images.length > 0 ? 'none' : 'flex' }}>
                                  <FaBox className="text-gray-400" />
                                </div>
                              </div>
                             
                             <div className="flex-1">
                               <div className="font-medium text-gray-900">
                                 {selectedVariant.colorName || 'Default Color'}
                               </div>
                               <div className="text-sm text-gray-600">
                                 Sizes: {selectedVariant.sizes?.join(', ') || 'No sizes'}
                               </div>
                                                               <div className="text-sm text-gray-600">
                                  Price: BDT{selectedVariant.prices?.[0] || selectedVariant.price || 0}
                                  {selectedVariant.discountPrices?.[0] && (
                                    <span className="ml-2 text-green-600">
                                      (Discounted: BDT{selectedVariant.discountPrices[0]})
                                    </span>
                                  )}
                                </div>
                               {/* Color Preview */}
                               {selectedVariant.hexCode && (
                                 <div className="flex items-center space-x-2 mt-1">
                                   <div 
                                     className="w-4 h-4 rounded-full border border-gray-300"
                                     style={{ backgroundColor: selectedVariant.hexCode }}
                                   ></div>
                                   <span className="text-xs text-gray-500">{selectedVariant.hexCode}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   )}
                 </div>
               )}

                             {/* Variants Preview (Bulk Mode) */}
               {selectedProduct && bulkMode && availableVariants.length > 0 && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Select Variants to Create Inventory For
                   </label>
                   <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                     <div className="space-y-3">
                       {availableVariants.map((variant) => (
                         <div key={variant._id} className="border rounded-lg p-3 bg-white">
                                                                                   <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center space-x-3">
                                 <input
                                   type="checkbox"
                                   checked={selectedVariants.includes(variant._id)}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       setSelectedVariants(prev => [...prev, variant._id]);
                                     } else {
                                       setSelectedVariants(prev => prev.filter(id => id !== variant._id));
                                     }
                                   }}
                                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {variant.colorName || 'Default Color'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Sizes: {variant.sizes?.join(', ') || 'No sizes'}
                                  </div>
                                  {/* Color Preview */}
                                  {variant.hexCode && (
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div 
                                        className="w-4 h-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: variant.hexCode }}
                                      ></div>
                                      <span className="text-xs text-gray-500">{variant.hexCode}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                             <div className="text-right">
                               <div className="text-sm font-medium text-gray-900">
                                 BDT{variant.prices?.[0] || variant.price || 0}
                               </div>
                               <div className="text-xs text-gray-500">
                                 Current Stock: {variant.stock || 0}
                               </div>
                             </div>
                           </div>
                           
                                                       {/* Individual stock input for each variant */}
                            {selectedVariants.includes(variant._id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="mb-2">
                                  <div className="text-sm font-medium text-gray-700">Number of individual barcodes/QR codes to create:</div>
                                  <div className="text-xs text-gray-500">Each unit will get a unique barcode and QR code</div>
                                </div>
                                <div className="space-y-3">
                                  {variant.sizes?.map((size, index) => (
                                    <div key={`${variant._id}-${size}`} className="border rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                          Size: {size}
                                        </label>
                                        <div className="text-xs text-gray-600">
                                          Price: BDT{variant.prices?.[index] || variant.prices?.[0] || 0}
                                          {variant.discountPrices?.[index] && (
                                            <span className="ml-2 text-green-600">
                                              (Discounted: BDT{variant.discountPrices[index]})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700 min-w-16">
                                          Quantity:
                                        </label>
                                        <input
                                          type="number"
                                          value={variantStock[variant._id]?.[size] || 0}
                                          onChange={(e) => {
                                            const newValue = parseInt(e.target.value) || 0;
                                            setVariantStock(prev => ({
                                              ...prev,
                                              [variant._id]: {
                                                ...prev[variant._id],
                                                [size]: newValue
                                              }
                                            }));
                                          }}
                                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                          min="0"
                                          placeholder="Quantity"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

                                                           {/* Stock Quantity - Only show for single mode */}
                {!bulkMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Create Individual Item
                    </label>
                    <div className="text-xs text-gray-500 mb-2">This will create 1 individual item with a unique barcode and QR code</div>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                      1 Individual Item (Fixed)
                    </div>
                  </div>
                )}

                {/* Price Fields */}
                {formData.variantId && (
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!formData.manualPricing}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          manualPricing: !e.target.checked,
                          // Reset to variant prices when auto-pricing is enabled
                          price: e.target.checked ? (availableVariants.find(v => v._id === formData.variantId)?.prices?.[0] || availableVariants.find(v => v._id === formData.variantId)?.price || 0) : prev.price,
                          discountPrice: e.target.checked ? (availableVariants.find(v => v._id === formData.variantId)?.discountPrices?.[0] || 0) : prev.discountPrice
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Use variant prices (auto-filled)
                      </span>
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (BDT) {formData.variantId && !formData.manualPricing && <span className="text-xs text-gray-500">(Auto-filled from variant)</span>}
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.variantId && !formData.manualPricing ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-900'}`}
                      min="0"
                      step="0.01"
                      placeholder={formData.variantId && !formData.manualPricing ? "Auto-filled from variant" : "Enter price"}
                      readOnly={!!formData.variantId && !formData.manualPricing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Price (BDT) {formData.variantId && !formData.manualPricing && <span className="text-xs text-gray-500">(Auto-filled from variant)</span>}
                    </label>
                    <input
                      type="number"
                      value={formData.discountPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPrice: parseFloat(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.variantId && !formData.manualPricing ? 'bg-gray-50 text-gray-600' : 'bg-white text-gray-900'}`}
                      min="0"
                      step="0.01"
                      placeholder={formData.variantId && !formData.manualPricing ? "Auto-filled from variant" : "Enter discount price (optional)"}
                      readOnly={!!formData.variantId && !formData.manualPricing}
                    />
                  </div>
                </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                                     <input
                     type="text"
                     value={formData.location.warehouse}
                     onChange={(e) => setFormData(prev => ({ 
                       ...prev, 
                       location: { ...prev.location, warehouse: e.target.value }
                     }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                   />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shelf</label>
                                     <input
                     type="text"
                     value={formData.location.shelf}
                     onChange={(e) => setFormData(prev => ({ 
                       ...prev, 
                       location: { ...prev.location, shelf: e.target.value }
                     }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                   />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                     <input
                     type="text"
                     value={formData.location.section}
                     onChange={(e) => setFormData(prev => ({ 
                       ...prev, 
                       location: { ...prev.location, section: e.target.value }
                     }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                   />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                 <textarea
                   value={formData.notes}
                   onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                   placeholder="Add notes about this inventory item..."
                 />
              </div>

              {/* Show QR Code and Barcode for existing inventory */}
              {selectedInventory && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Codes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-mono text-gray-800">{selectedInventory.barcode}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: generateSVGQRCodeSync(selectedInventory.qrCode, 60) 
                          }}
                        />
                        <div className="text-xs font-mono text-gray-600">{selectedInventory.qrCode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedInventory(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedInventory ? handleUpdateInventory : handleCreateInventory}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  {selectedInventory ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Codes Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                          <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Print Individual Barcodes & QR Codes</h2>
                    <p className="text-sm text-gray-600 mt-1">Each selected item represents one unique barcode and QR code</p>
                  </div>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

            <div className="p-6">
              {/* Print Settings */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Print Settings</h3>
                  <img 
                    src="/Barvella.png" 
                    alt="Barvella" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Printer Type</label>
                    <select
                      value={printSettings.printerType}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, printerType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="normal">Normal Printer</option>
                      <option value="thermal">Thermal Printer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label Size</label>
                    <select
                      value={printSettings.labelSize}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, labelSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code Type</label>
                    <select
                      value={printSettings.qrCodeType}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, qrCodeType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="qrCode">QR Code Only</option>
                      <option value="barcode">Barcode Only</option>
                      <option value="combined">Both (QR + Barcode)</option>
                    </select>
                  </div>


                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printSettings.showProductInfo}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, showProductInfo: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Show Product Info</label>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-4">
                                  <button
                  onClick={() => {
                    const newQuantities = {};
                    selectedItems.forEach(itemId => {
                      newQuantities[itemId] = 1;
                    });
                    setPrintQuantities(newQuantities);
                    toast.success('All quantities set to 1 copy each');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                >
                  Set All to 1 Copy
                </button>
                  <button
                    onClick={() => {
                      setPrintQuantities({});
                      toast.success('All quantities reset');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition"
                  >
                    Reset All Quantities
                  </button>
                  <button
                    onClick={() => {
                      setPrintSettings(prev => ({ ...prev, qrCodeType: 'qrCode' }));
                      toast.success('Switched to QR Code mode');
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                  >
                    Force QR Code Mode
                  </button>
                  

                  <div className="text-sm text-gray-600">
                    Total codes to print: {selectedItems.reduce((sum, itemId) => {
                      const item = inventory.find(inv => inv._id === itemId);
                      const quantity = printQuantities[itemId] || item?.stockQuantity || 0;
                      return sum + quantity;
                    }, 0)}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Current Mode: {printSettings.qrCodeType.toUpperCase()}
                  </div>
                  <button
                    onClick={async () => {
                      const testItem = inventory.find(inv => inv._id === selectedItems[0]);
                      if (testItem) {
                        console.log('Testing raw QR code data conversion...');
                        console.log('Raw QR code data:', testItem.qrCode);
                        console.log('Raw barcode data:', testItem.barcode);
                        console.log('Current print type:', printSettings.qrCodeType);
                        
                        // Test direct QR code generation using QRCode library
                        try {
                          const qrSVG = await QRCode.toString(testItem.qrCode, {
                            type: 'svg',
                            width: 16,
                            margin: 1,
                            color: {
                              dark: '#000000',
                              light: '#FFFFFF'
                            },
                            errorCorrectionLevel: 'M'
                          });
                          console.log('Raw QR code converted to SVG successfully!');
                          console.log('QR SVG length:', qrSVG.length);
                          console.log('QR SVG preview:', qrSVG.substring(0, 100) + '...');
                          
                          // Test barcode generation
                          const barcodeSVG = generateSVGBarcode(testItem.barcode, 'normal', 'medium');
                          console.log('Raw barcode converted to SVG successfully!');
                          console.log('Barcode SVG length:', barcodeSVG.length);
                          
                          toast.success('Raw data conversion working! Check console for details.');
                        } catch (error) {
                          console.error('Raw data conversion failed:', error);
                          toast.error('Raw data conversion failed! Check console for details.');
                        }
                      }
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                  >
                    Test Raw Data Conversion
                  </button>

                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-600">Generated codes for printing</p>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {selectedItems.map((itemId) => {
                  const item = inventory.find(inv => inv._id === itemId);
                  if (!item) return null;
                   
                  return (
                                         <div key={itemId} className="border rounded-lg p-4 bg-gray-50">
                       <div className="text-center">
                         {/* Variant Image */}
                         <div className="mb-3 flex justify-center">
                           <img 
                             src={item.imageUri || item.productId?.mainImage} 
                             alt={item.productId?.name}
                             className="w-16 h-16 object-cover rounded border"
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                           <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center" style={{ display: (item.imageUri || item.productId?.mainImage) ? 'none' : 'flex' }}>
                             <FaBox className="text-gray-400 text-sm" />
                           </div>
                         </div>
                         
                         <h3 className="font-medium text-sm mb-2">{item.productId?.name}</h3>
                         <p className="text-xs text-gray-600 mb-1">Size: {item.size}</p>
                         
                                                   {/* Price Display */}
                          <div className="text-xs mb-2">
                            {item.discountPrice ? (
                              <>
                                <span className="line-through text-gray-400">BDT{item.price}</span>
                                <span className="ml-1 text-green-600 font-medium">BDT{item.discountPrice}</span>
                              </>
                            ) : (
                              <span className="text-gray-700">BDT{item.price}</span>
                            )}
                          </div>
                                                 {item.color?.name && (
                           <div className="flex items-center justify-center space-x-2 mb-3">
                             {item.color?.hexCode && (
                               <div 
                                 className="w-4 h-4 rounded-full border border-gray-300"
                                 style={{ backgroundColor: item.color.hexCode }}
                               ></div>
                             )}
                             <span className="text-xs text-gray-600">{item.color.name}</span>
                           </div>
                         )}
                         
                        {/* Print Quantity Input */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Copies to Print</label>
                          <input
                            type="number"
                            value={printQuantities[itemId] || 1}
                            onChange={(e) => setPrintQuantities(prev => ({
                              ...prev,
                              [itemId]: parseInt(e.target.value) || 1
                            }))}
                                                         className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                            min="1"
                            max="50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max: 50 copies</p>
                        </div>
                          
                                                <div className="space-y-2">
                          {printSettings.qrCodeType === 'barcode' && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-1">Barcode</div>
                              <div className="bg-white p-2 rounded border flex items-center justify-center h-16">
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ 
                                    __html: generateSVGBarcode(item.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize) 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          {printSettings.qrCodeType === 'qrCode' && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-1">QR Code</div>
                              <div className="bg-white p-2 rounded border flex items-center justify-center">
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: generateSVGQRCodeSync(item.qrCode || 'NOQRCODE', 60) 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          {printSettings.qrCodeType === 'combined' && (
                            <>
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">Barcode</div>
                                <div className="bg-white p-2 rounded border flex items-center justify-center h-12">
                                  <div 
                                    className="w-full h-full flex items-center justify-center"
                                    dangerouslySetInnerHTML={{ 
                                      __html: generateSVGBarcode(item.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize) 
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">QR Code</div>
                                <div className="bg-white p-2 rounded border flex items-center justify-center">
                                  <div 
                                    dangerouslySetInnerHTML={{ 
                                      __html: generateSVGQRCodeSync(item.qrCode || 'NOQRCODE', 35) 
                                    }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Print Preview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Print Preview</h3>
                  <img 
                    src="/Barvella.png" 
                    alt="Barvella" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  {printSettings.printerType === 'thermal' ? (
                    // Thermal printer preview
                    <div className="space-y-2">
                      {selectedItems.slice(0, 3).map((itemId) => {
                        const item = inventory.find(inv => inv._id === itemId);
                        if (!item) return null;
                        
                        return (
                          <div key={itemId} className="border border-gray-300 rounded p-3 bg-gray-50">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex-1 text-left">
                                <div className="font-bold">{item.productId?.name}</div>
                                <div>Size: {item.size}</div>
                                {item.color?.name && <div>Color: {item.color.name}</div>}
                                <div className="font-bold">
                                  {item.discountPrice ? `BDT${item.discountPrice}` : `BDT${item.price}`}
                                </div>
                              </div>
                                                             <div className="flex-1 text-center flex flex-col items-center justify-center space-y-1">
                                 {printSettings.qrCodeType === 'barcode' && (
                                   <div className="flex items-center justify-center">
                                     <div 
                                       dangerouslySetInnerHTML={{ 
                                         __html: generateSVGBarcode(item.barcode, 'thermal', printSettings.labelSize) 
                                       }}
                                     />
                                   </div>
                                 )}
                                 {printSettings.qrCodeType === 'qrCode' && (
                                   <div className="flex items-center justify-center">
                                                                            <div 
                                         dangerouslySetInnerHTML={{ 
                                           __html: generateSVGQRCodeSync(item.qrCode, 20) 
                                         }}
                                       />
                                   </div>
                                 )}
                                 {printSettings.qrCodeType === 'combined' && (
                                   <div className="flex flex-col items-center justify-center space-y-1">
                                     <div className="flex items-center justify-center">
                                       <div 
                                         dangerouslySetInnerHTML={{ 
                                           __html: generateSVGBarcode(item.barcode, 'thermal', printSettings.labelSize) 
                                         }}
                                       />
                                     </div>
                                     <div className="flex items-center justify-center">
                                       <div 
                                         dangerouslySetInnerHTML={{ 
                                           __html: generateSVGQRCodeSync(item.qrCode, 16) 
                                         }}
                                       />
                                     </div>
                                   </div>
                                 )}
                               </div>
                              <div className="flex-1 text-right">
                                <div className="font-bold">{item.barcode}</div>
                                <div>Qty: 1</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Normal printer preview
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {selectedItems.slice(0, 12).map((itemId) => {
                        const item = inventory.find(inv => inv._id === itemId);
                        if (!item) return null;
                        
                        const quantity = printQuantities[itemId] || item.stockQuantity;
                        
                        return (
                          <div key={itemId} className="border border-gray-200 rounded p-3 text-center min-h-[120px] flex flex-col justify-between bg-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                            <>
                              {printSettings.showProductInfo && (
                                <div className="mb-2">
                                  <div className="text-xs font-semibold text-gray-800 uppercase tracking-wide">{item.productId?.name}</div>
                                  <div className="text-xs text-gray-600 bg-gray-50 px-1 py-0.5 rounded border border-gray-200 inline-block">Size: {item.size}</div>
                                  {item.color?.name && (
                                    <>
                                      <div className="text-xs text-gray-700 font-medium">Color: {item.color.name}</div>
                                      <div className="text-xs text-gray-600 flex items-center justify-center space-x-1">
                                        {item.color?.hexCode && (
                                          <div 
                                            className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                            style={{ backgroundColor: item.color.hexCode }}
                                          ></div>
                                        )}
                                        <span className="text-xs">{item.color.hexCode}</span>
                                      </div>
                                    </>
                                  )}
                                  {/* Price Display */}
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    {item.discountPrice ? (
                                      <>
                                        <span className="line-through text-gray-400">BDT{item.price}</span>
                                        <span className="ml-1">BDT{item.discountPrice}</span>
                                      </>
                                    ) : (
                                      <span>BDT{item.price}</span>
                                    )}
                                  </div>

                                </div>
                              )}

                                                             {printSettings.showQRCode && (
                                 <div className="space-y-2">
                                                                                                       {printSettings.qrCodeType === 'barcode' && (
                                     <div>
                                       <div className="mt-1">
                                         <div 
                                           className="h-10 bg-white border border-gray-300 rounded flex items-center justify-center p-1"
                                         >
                                           <div 
                                             className="w-full h-full flex items-center justify-center"
                                             dangerouslySetInnerHTML={{ 
                                               __html: generateSVGBarcode(item.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize) 
                                             }}
                                           />
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                   {printSettings.qrCodeType === 'qrCode' && (
                                     <div>
                                       <div className="flex items-center space-x-2">
                                         <div className="bg-white p-1 border rounded">
                                           <div 
                                             dangerouslySetInnerHTML={{ 
                                               __html: generateSVGQRCodeSync(item.qrCode || 'NOQRCODE', 40) 
                                             }}
                                           />
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                   {printSettings.qrCodeType === 'combined' && (
                                     <div className="space-y-2">
                                       <div>
                                         <div className="mt-1">
                                           <div 
                                             className="h-10 bg-white border border-gray-300 rounded flex items-center justify-center p-1"
                                           >
                                             <div 
                                               className="w-full h-full flex items-center justify-center"
                                               dangerouslySetInnerHTML={{ 
                                                 __html: generateSVGBarcode(item.barcode || 'NOBARCODE', printSettings.printerType, printSettings.labelSize) 
                                               }}
                                             />
                                           </div>
                                         </div>
                                       </div>
                                       <div>
                                         <div className="flex items-center justify-center">
                                           <div className="bg-white p-1 border rounded">
                                             <div 
                                               dangerouslySetInnerHTML={{ 
                                                 __html: generateSVGQRCodeSync(item.qrCode || 'NOQRCODE', 35) 
                                               }}
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               )}
                                                             <div className="text-xs text-gray-500 bg-gray-50 px-1 py-0.5 rounded border border-gray-200 mt-1 text-center">{quantity}</div>
                            </>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="text-center mt-3 text-sm text-gray-600">
                    {printSettings.printerType === 'thermal' ? 
                      `Thermal labels - ${selectedItems.length} items (${printSettings.labelSize === 'small' ? '4x2' : printSettings.labelSize === 'large' ? '2x2' : '3x2'} grid per page)` : 
                      `Page 1 of ${Math.ceil(selectedItems.length / (printSettings.labelSize === 'small' ? 48 : printSettings.labelSize === 'large' ? 20 : 32))}`
                    }
                  </div>
                </div>
              </div>
               
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
                                 <button
                   onClick={async () => {
                     // Generate print content based on settings
                     const { content: printContent } = await generatePrintContent();
                     await printCodes(printContent);
                   }}
                   className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                 >
                   <FaPrint className="mr-2" /> Print
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Code Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Scan Barcode/QR Code</h2>
                <button
                  onClick={() => {
                    setShowScanModal(false);
                    setScannedCode('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {scannedCode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Scanned Code:</strong> {scannedCode}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    This code was not found in the inventory. You can modify it or try a different code.
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Code</label>
                                 <input
                   type="text"
                   value={scannedCode}
                   onChange={(e) => setScannedCode(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                   placeholder="Enter barcode or QR code..."
                   autoFocus
                 />
              </div>
               
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Or scan with your device camera</div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-xs text-gray-500">
                    📱 Use your phone's camera to scan QR codes<br/>
                    📊 Use a barcode scanner for barcodes
                  </div>
                </div>
                
                {/* Show example QR code and barcode */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2">Example QR Code</div>
                    <div className="bg-white p-2 rounded border">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: generateSVGQRCodeSync('INV-EXAMPLE-123', 40) 
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2">Example Barcode</div>
                    <div className="bg-white p-2 rounded border">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: generateSVGBarcode('INV-EXAMPLE-123', 'normal', 'small') 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowScanModal(false);
                    setScannedCode('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScanCode}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title={`${scanMode === 'qr' ? 'QR Code' : 'Barcode'} Scanner`}
        mode={scanMode}
      />
    </div>
  );
};

export default AdminInventory;
