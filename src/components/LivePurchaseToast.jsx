import React, { useEffect, useState, useRef } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import io from 'socket.io-client';

const LivePurchaseToast = () => {
  const [purchase, setPurchase] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(`${import.meta.env.VITE_API_URI}`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('livePurchase', (data) => {
      setPurchase(data);
      setTimeout(() => setPurchase(null), 5000);
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  if (!purchase) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3 max-w-xs">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <FaShoppingBag className="text-green-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{purchase.productName}</p>
          <p className="text-xs text-gray-500">Someone just purchased{purchase.quantity > 1 ? ` ×${purchase.quantity}` : ''}</p>
        </div>
      </div>
    </div>
  );
};

export default LivePurchaseToast;
