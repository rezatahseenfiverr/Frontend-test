"use client";
import React, { useContext, useState, useEffect } from "react";
import { useUserChat } from "../context/UserChatContext";
import { UserContext } from "../context/UserContext";

const ChatDrawer = () => {
  const { user } = useContext(UserContext);
  const {
    isOpen,
    inputMessage,
    messages,
    isConnected,
    isLoading,
    error,
    messagesEndRef,
    unreadCount,
    newMessageNotifications,
    showNotification,
    isOnline,
    assignedAdmin,
    isTyping,
    openChat,
    closeChat,
    setInputMessage,
    handleSend,
    clearError,
    clearNotifications,
    retryLoadChat,
    sendTypingIndicator,
    socket,
    activeRoom,
  } = useUserChat();

  const [typingTimeout, setTypingTimeout] = useState(null);

  // Check if device is mobile
  const isMobile = () => window.innerWidth <= 768;

  // Draggable position state for desktop only
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const DRAWER_W = 320; // w-80
  const BTN_W = 64;     // approx button size
  const BTN_H = 64;     // approx button size
  const MARGIN = 16;    // 1rem

  // Helper to get current open drawer size (taller: 70vh height)
  const getOpenSize = () => ({
    w: DRAWER_W,
    h: Math.max(360, Math.floor(window.innerHeight * 0.7))
  });

  // Initialize position (bottom-right by default) and load from localStorage
  useEffect(() => {
    if (position.x !== null && position.y !== null) return;
    try {
      const saved = localStorage.getItem('chatDrawerPos');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition({ x: parsed.x, y: parsed.y });
        return;
      }
    } catch {}
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const usedW = isOpen ? getOpenSize().w : BTN_W;
    const usedH = isOpen ? getOpenSize().h : BTN_H;
    // default bottom-right, slightly up when closed
    const x = Math.max(MARGIN, vw - usedW - MARGIN);
    const yBase = Math.max(MARGIN, vh - usedH - MARGIN);
    const y = isOpen ? yBase : Math.max(MARGIN, yBase - 16);
    setPosition({ x, y });
  }, [position.x, position.y, isOpen]);

  // Clamp position on resize
  useEffect(() => {
    const onResize = () => {
      setPosition(prev => {
        if (prev.x === null || prev.y === null) return prev;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const usedW = isOpen ? getOpenSize().w : BTN_W;
        const usedH = isOpen ? getOpenSize().h : BTN_H;
        const x = Math.min(Math.max(MARGIN, prev.x), Math.max(MARGIN, vw - usedW - MARGIN));
        const y = Math.min(Math.max(MARGIN, prev.y), Math.max(MARGIN, vh - usedH - MARGIN));
        return { x, y };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen]);

  const startDrag = (e) => {
    e.preventDefault(); // Prevent default to avoid conflicts
    const point = 'touches' in e ? e.touches[0] : e;
    if (position.x === null || position.y === null) return;
    dragOffsetRef.current = {
      x: point.clientX - position.x,
      y: point.clientY - position.y,
    };
    setDragStartTime(Date.now());
    setIsDragging(true);
  };

  const handleClick = (e) => {
    // Only open chat if we haven't been dragging for more than 200ms
    const dragDuration = Date.now() - dragStartTime;
    if (!isDragging || dragDuration < 200) {
      openChat();
    }
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling on mobile while dragging
      const point = e.touches ? e.touches[0] : e;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x = point.clientX - dragOffsetRef.current.x;
      let y = point.clientY - dragOffsetRef.current.y;
      const usedW = isOpen ? getOpenSize().w : BTN_W;
      const usedH = isOpen ? getOpenSize().h : BTN_H;
      x = Math.min(Math.max(MARGIN, x), Math.max(MARGIN, vw - usedW - MARGIN));
      y = Math.min(Math.max(MARGIN, y), Math.max(MARGIN, vh - usedH - MARGIN));
      setPosition({ x, y });
    };
    const onUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setDragStartTime(0);
      try {
        const { x, y } = position;
        if (x !== null && y !== null) {
          localStorage.setItem('chatDrawerPos', JSON.stringify({ x, y }));
        }
      } catch {}
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, position, isOpen]);

  // Helper function to check if message is read by admin
  const isMessageReadByAdmin = (message) => {
    if (message.senderType !== "customer") return false;
    return message.readBy?.some(read => read.readerType === "admin");
  };

  // Helper function to format read time
  const formatReadTime = (message) => {
    const readEntry = message.readBy?.find(read => read.readerType === "admin");
    if (!readEntry) return null;
    return new Date(readEntry.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Early return after all hooks are called
  if (!user) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && isMobile() && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
          onClick={closeChat}
        />
      )}
      
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
        <div className="relative" style={{ position: 'fixed', left: position.x ?? 'auto', top: position.y ?? 'auto', zIndex: 10000 }}>
          <button
            onClick={handleClick}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className={`bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition relative cursor-move ${isDragging ? 'scale-95 shadow-xl' : ''}`}
            aria-label="Open chat"
          >
            {/* Chat Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification popup */}
          {showNotification && newMessageNotifications.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-3 animate-slide-in">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">New Message</h4>
                <button 
                  onClick={clearNotifications}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {newMessageNotifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{notification.sender}</span>
                      <span className="text-gray-500">{notification.timestamp}</span>
                    </div>
                    <p className="text-gray-600 truncate">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 ${
            isMobile() 
              ? 'fixed z-50 w-full h-full animate-slide-up' 
              : 'w-80'
          }`}
          style={isMobile() ? {
            position: 'fixed',
            left: position.x ?? 'auto',
            top: position.y ?? 'auto',
            zIndex: 10000,
            width: '100%',
            height: '100%'
          } : { 
            position: 'fixed', 
            left: position.x ?? 'auto', 
            top: position.y ?? 'auto', 
            zIndex: 10000, 
            height: `${getOpenSize().h}px`, 
            maxHeight: '80vh' 
          }}
        >
          <div
            className={`p-3 rounded-t-lg flex justify-between items-center ${isConnected ? "bg-blue-600" : "bg-gray-500"} text-white cursor-move ${isDragging ? 'opacity-90' : ''}`}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            <div className="flex flex-col">
              <h3 className="font-semibold">
                {assignedAdmin ? `${assignedAdmin.firstName || 'Admin'}` : "Customer Support"}
              </h3>
              <div className="flex items-center space-x-2 text-xs opacity-90">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
                {assignedAdmin && (
                  <>
                    <span>•</span>
                    <span>{isOnline ? "Online" : "Offline"}</span>
                    {isOnline && (
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>Active</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button onClick={closeChat} className="text-white hover:text-gray-200" aria-label="Close chat">✕</button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-full space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading chat...</p>
                {/* Debug info */}
                <div className="text-xs text-gray-400 mt-2 text-center">
                  <p>User: {user?._id ? 'Logged in' : 'Not logged in'}</p>
                  <p>Room: {activeRoom?._id ? 'Exists' : 'Not found'}</p>
                  <p>Socket: {isConnected ? 'Connected' : 'Disconnected'}</p>
                  <p>Messages: {messages?.length || 0}</p>
                  <button 
                    onClick={retryLoadChat}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Manual Refresh
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 mt-10 p-4">
                <p className="mb-2">{error}</p>
                <div className="space-x-2">
                  <button 
                    onClick={retryLoadChat} 
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={closeChat} 
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>Start a conversation with our support team</p>
                <p className="text-sm mt-1">We're here to help!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={`${msg._id || idx}`} className={`mb-3 ${msg.senderType === "customer" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block px-4 py-2 rounded-lg break-words whitespace-pre-wrap ${msg.senderType === "customer" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`} style={{ maxWidth: '260px', wordBreak: 'break-word' }}>
                    {msg.text}
                    <div className="text-xs mt-1 opacity-70 flex items-center justify-end space-x-1">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {msg.senderType === "customer" && (
                        <span className={isMessageReadByAdmin(msg) ? "text-blue-300" : "text-gray-400"}>
                          {isMessageReadByAdmin(msg) ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                    {msg.senderType === "customer" && isMessageReadByAdmin(msg) && (
                      <div className="text-xs opacity-70 text-right">
                        Seen {formatReadTime(msg)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="text-left mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Typing</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className={`flex-1 border rounded-l-lg px-3 py-2 focus:outline-none ${isConnected ? "focus:ring-1 focus:ring-blue-500" : "cursor-not-allowed"}`}
                disabled={!isConnected}
              />
              <button
                onClick={handleSend}
                className={`px-4 py-2 rounded-r-lg transition ${isConnected && inputMessage.trim() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-400 text-white cursor-not-allowed"}`}
                disabled={!inputMessage.trim() || !isConnected}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ChatDrawer;
