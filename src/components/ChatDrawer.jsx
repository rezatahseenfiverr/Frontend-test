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
    chatMode,
    setChatMode,
    aiMessages,
    isAiLoading,
    aiError,
    clearAiError,
    fetchAIChat,
    clearAIChat,
  } = useUserChat();

  const [typingTimeout, setTypingTimeout] = useState(null);

  // Check if device is mobile
  const isMobile = () => window.innerWidth <= 768;

  // Mode-aware computed values
  const activeMessages = chatMode === "ai" ? aiMessages : messages;
  const activeError = chatMode === "ai" ? aiError : error;
  const canSend = chatMode === "ai" ? Boolean(inputMessage.trim()) && !isAiLoading : Boolean(inputMessage.trim()) && isConnected;
  const activePlaceholder = chatMode === "ai" ? "Ask about orders, compare products..." : "Type your message...";

  const handleModeSwitch = (mode) => {
    setChatMode(mode);
    clearError();
    if (mode === "ai") fetchAIChat();
  };

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
            className={`p-3 rounded-t-lg ${chatMode === "ai" ? "bg-gradient-to-r from-indigo-500 to-purple-600" : isConnected ? "bg-blue-600" : "bg-gray-500"} text-white cursor-move ${isDragging ? 'opacity-90' : ''}`}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">
                {chatMode === "ai" ? "AI Assistant" : (assignedAdmin ? `${assignedAdmin.firstName || 'Admin'}` : "Customer Support")}
              </h3>
              <div className="flex items-center gap-2">
                {chatMode === "ai" && (
                  <button onClick={clearAIChat} className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition">Clear</button>
                )}
                <button onClick={closeChat} className="text-white hover:text-gray-200">✕</button>
              </div>
            </div>
            <div className="flex items-center text-xs opacity-90">
              <span className={`w-2 h-2 rounded-full mr-1 ${chatMode === "ai" ? 'bg-indigo-200' : isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>{chatMode === "ai" ? "Orders · Compare · Recommend" : (isConnected ? "Connected" : "Disconnected")}</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button onClick={() => handleModeSwitch("support")} className={`flex-1 py-2 text-xs font-semibold transition ${chatMode==="support" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>💬 Customer Care</button>
            <button onClick={() => handleModeSwitch("ai")} className={`flex-1 py-2 text-xs font-semibold transition ${chatMode==="ai" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>🤖 AI Helper</button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {chatMode === "support" && isLoading ? (
              <div className="flex flex-col justify-center items-center h-full space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading chat...</p>
                <button onClick={retryLoadChat} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Refresh</button>
              </div>
            ) : activeError ? (
              <div className="text-center text-red-500 mt-10 p-4">
                <p className="mb-2">{activeError}</p>
                {chatMode === "support" && <button onClick={retryLoadChat} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Retry</button>}
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                {chatMode === "ai" ? (
                  <><p className="text-lg mb-1">🤖</p><p>I can track orders, compare products, or recommend items!</p></>
                ) : (
                  <><p>Start a conversation with our support team</p><p className="text-sm mt-1">We're here to help!</p></>
                )}
              </div>
            ) : (
              activeMessages.map((msg, idx) => {
                const isUser = msg.senderType === "customer" || msg.role === "user";
                const isAI = msg.senderType === "assistant" || msg.role === "assistant";
                let bubbleClass = isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800";
                if (chatMode === "ai" && isAI) bubbleClass = "bg-indigo-50 text-gray-800 border border-indigo-100";
                if (chatMode === "ai" && isUser) bubbleClass = "bg-indigo-600 text-white";
                return (
                  <div key={msg._id || idx} className={`mb-3 ${isUser ? "text-right" : "text-left"}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl break-words whitespace-pre-wrap ${bubbleClass}`} style={{ maxWidth: '260px', wordBreak: 'break-word' }}>
                      {msg.content || msg.text}
                      {chatMode === "support" && isUser && (
                        <div className="text-xs mt-1 opacity-70 flex justify-end">
                          <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* AI loading */}
            {chatMode === "ai" && isAiLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl rounded-bl-md text-sm text-indigo-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:"0.1s"}} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:"0.2s"}} />
                </div>
              </div>
            )}

            {/* Support typing */}
            {chatMode === "support" && isTyping && (
              <div className="text-left mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  <span className="text-sm">Typing</span>
                  <div className="flex space-x-1 inline-flex ml-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.1s"}} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.2s"}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  if (chatMode === "support") handleTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={activePlaceholder}
                disabled={chatMode === "support" && !isConnected}
                className={`flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none ${
                  chatMode === "ai" ? "focus:ring-2 focus:ring-indigo-300" : "focus:ring-2 focus:ring-blue-300"
                } disabled:opacity-50`}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  canSend
                    ? chatMode === "ai"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                {chatMode === "ai" && isAiLoading ? "..." : "Send"}
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
