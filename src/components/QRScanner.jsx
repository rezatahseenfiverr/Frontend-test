import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera, FaQrcode } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onClose, isOpen, title = 'QR Code Scanner', mode = 'qr' }) => {
  const [error, setError] = useState('');
  const [scanningMode, setScanningMode] = useState(mode);
  const [isInitializing, setIsInitializing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    console.log('QRScanner: isOpen changed to', isOpen);
    if (isOpen) {
      // Add a small delay to ensure the DOM element is ready
      setTimeout(() => {
        startScanner();
      }, 100);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      console.log('QRScanner: Starting scanner...');
      setIsInitializing(true);
      setError('');
      setDebugInfo('Initializing scanner...');

      // Clear any existing scanner
      if (html5QrCodeRef.current) {
        console.log('QRScanner: Clearing existing scanner');
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }

      // Wait for the DOM element to be available
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        throw new Error('QR reader element not found');
      }
      console.log('QRScanner: Found qr-reader element');

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      };

      console.log('QRScanner: Creating Html5QrcodeScanner with config:', config);
      html5QrCodeRef.current = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );

      console.log('QRScanner: Rendering scanner...');
      html5QrCodeRef.current.render(onScanSuccess, onScanFailure);
      setDebugInfo('Scanner ready - waiting for QR code...');
      
    } catch (err) {
      console.error('QRScanner: Scanner start error:', err);
      setError(`Unable to start scanner: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = () => {
    try {
      console.log('QRScanner: Stopping scanner...');
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setDebugInfo('Scanner stopped');
    } catch (err) {
      console.error('QRScanner: Error stopping scanner:', err);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log('QRScanner: QR Code detected:', decodedText);
    console.log('QRScanner: Full decoded result:', decodedResult);
    setDebugInfo(`QR Code detected: ${decodedText}`);
    
    try {
      onScan(decodedText);
      onClose();
    } catch (err) {
      console.error('QRScanner: Error handling scan result:', err);
      setError('Error processing scanned data');
    }
  };

  const onScanFailure = (error) => {
    // Handle scan failure silently - this is normal during scanning
    // Only log if it's not a normal scanning failure
    if (error && !error.toString().includes('NotFoundException')) {
      console.log('QRScanner: Scan failure:', error);
      setDebugInfo(`Scan failure: ${error}`);
    }
  };

  const handleManualInput = () => {
    const promptText = scanningMode === 'qr' 
      ? 'Enter QR code data manually:' 
      : 'Enter barcode data manually:';
    const data = prompt(promptText);
    if (data && data.trim()) {
      console.log('QRScanner: Manual input:', data.trim());
      onScan(data.trim());
      onClose();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // For now, we'll just use the file name as QR data
        // In a real implementation, you'd use a QR code decoding library
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        console.log('QRScanner: File upload:', fileName);
        onScan(fileName);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetry = () => {
    console.log('QRScanner: Retrying scanner...');
    setError('');
    setDebugInfo('Retrying...');
    startScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaQrcode className="mr-2 text-blue-500" />
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setScanningMode('qr')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  scanningMode === 'qr' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => setScanningMode('barcode')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  scanningMode === 'barcode' 
                    ? 'bg-purple-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Barcode
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 ml-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Debug info */}
        {debugInfo && (
          <div className="mb-4 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}

        <div className="relative mb-4">
          {isInitializing && (
            <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
          <div 
            id="qr-reader" 
            className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden"
            ref={scannerRef}
          ></div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleManualInput}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <FaQrcode className="mr-2" />
            Enter QR Code Manually
          </button>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center">
              <FaCamera className="mr-2" />
              Upload QR Code Image
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>Position the {scanningMode === 'qr' ? 'QR code' : 'barcode'} within the frame to scan</p>
          <p>Or use manual input/upload options above</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
