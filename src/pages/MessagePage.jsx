"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminChat } from "../context/AdminChatContext";
import { BiArrowBack, BiTransfer, BiX, BiSend, BiUserCheck } from "react-icons/bi";

const AdminMessagePage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const {
    activeRoom,
    messages,
    inputMessage,
    loading,
    error,
    onlineUsers,
    isTyping,
    fetchRoom,
    handleSend,
    transferRoom,
    closeRoom,
    joinRoom,
    setInputMessage,
    autoAssignAdmin,
    isConnected,
    markAsRead,
    updateOnlineStatus,
    sendTypingIndicator,
  } = useAdminChat();

  // Single effect to handle room initialization
  useEffect(() => {
    if (!roomId) {
      navigate("/admin/login");
      return;
    }

    // Only fetch if we don't already have the room or if it's a different room
    if (!activeRoom || activeRoom._id !== roomId) {
      console.log("Fetching room data for:", roomId);
      fetchRoom(roomId);
    } else {
      console.log("Room already loaded:", activeRoom._id);
      // Join room if we already have the room data
      if (isConnected) {
        joinRoom(roomId);
      }
    }
  }, [roomId, navigate]); // Removed activeRoom?._id to prevent infinite loops

  // Join room when socket connects or room changes
  useEffect(() => {
    if (isConnected && activeRoom?._id === roomId) {
      console.log("Joining room via socket:", roomId);
      joinRoom(roomId);
    }
  }, [isConnected, activeRoom?._id, roomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read instantly when room is loaded or new messages arrive
  useEffect(() => {
    if (activeRoom?._id === roomId && messages.length > 0 && isConnected) {
      console.log("Marking messages as read for room:", roomId);
      markAsRead();
    }
  }, [activeRoom?._id, roomId, isConnected, messages.length]);

  // Update online status when joining/leaving room
  useEffect(() => {
    if (activeRoom?._id === roomId && isConnected) {
      console.log("Setting online status for room:", roomId);
      updateOnlineStatus(true);
    }
    
    // Cleanup: set offline when leaving
    return () => {
      if (activeRoom?._id === roomId && isConnected) {
        console.log("Setting offline status for room:", roomId);
        updateOnlineStatus(false);
      }
    };
  }, [activeRoom?._id, roomId, isConnected]); // Only trigger when room actually changes

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || activeRoom?.isClosed || !isConnected) return;
    try {
      // Stop typing indicator when sending
      sendTypingIndicator(false);
      await handleSend();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Debounced typing indicator to prevent excessive socket emissions
  const typingTimeoutRef = useRef(null);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator with debouncing
    if (value.trim() && isConnected) {
      sendTypingIndicator(true);
      
      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else if (!value.trim() && isConnected) {
      sendTypingIndicator(false);
    }
  };

  const handleTransfer = async () => {
    if (!isConnected) {
      alert("Socket not connected. Please wait for connection.");
      return;
    }
    const newAdminId = prompt("Enter new admin ID:");
    if (!newAdminId) return;
    try {
      await transferRoom(roomId, newAdminId);
    } catch (err) {
      console.error("Failed to transfer room:", err);
    }
  };

  const handleClose = async () => {
    if (!isConnected) {
      alert("Socket not connected. Please wait for connection.");
      return;
    }
    if (!confirm("Are you sure you want to close this chat?")) return;
    try {
      await closeRoom(roomId);
    } catch (err) {
      console.error("Failed to close room:", err);
    }
  };

  const handleAutoAssign = async () => {
    if (!isConnected) {
      alert("Socket not connected. Please wait for connection.");
      return;
    }
    try {
      await autoAssignAdmin();
    } catch (err) {
      console.error("Failed to auto-assign admin:", err);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  // Helper function to check if message is read by customer
  const isMessageReadByCustomer = (message) => {
    if (message.senderType !== "admin") return false;
    return message.readBy?.some(read => read.readerType === "customer");
  };

  // Helper function to format read time
  const formatReadTime = (message) => {
    const readEntry = message.readBy?.find(read => read.readerType === "customer");
    if (!readEntry) return null;
    return new Date(readEntry.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (error) return (
    <div className="flex flex-col p-4 sm:ml-64 min-h-screen">
      <div className="flex-1 p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14 flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    </div>
  );
  
  if (loading || !isConnected) return (
    <div className="flex flex-col p-4 sm:ml-64 min-h-screen">
      <div className="flex-1 p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {loading ? "Loading chat..." : "Connecting to server..."}
          </p>
          {!isConnected && (
            <p className="text-sm text-gray-400 mt-2">
              Please wait while we establish a secure connection
            </p>
          )}
        </div>
      </div>
    </div>
  );
  
  if (!activeRoom) return (
    <div className="flex flex-col p-4 sm:ml-64 min-h-screen">
      <div className="flex-1 p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Chat room not found</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col p-4 sm:ml-64 min-h-screen">
      
      <div className="flex-1 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/admin/dashboard/inbox")}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <BiArrowBack className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <img
                src={activeRoom.customerId?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI0QzI4LjQxODMgMjQgMzIgMjAuNDE4MyAzMiAxNkMzMiAxMS41ODE3IDI4LjQxODMgOCAyNCA4QzE5LjU4MTcgOCAxNiAxMS41ODE3IDE2IDE2QzE2IDIwLjQxODMgMTkuNTgxNyAyNCAyNCAyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQwIDQwQzQwIDMyLjI2ODkgMzIuODM3IDI2IDI0IDI2QzE1LjE2MyAyNiA4IDMyLjI2ODkgOCA0MEg0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='}
                alt="Customer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold text-gray-900">
                  {activeRoom.customerId?.firstName && activeRoom.customerId?.lastName
                    ? `${activeRoom.customerId.firstName} ${activeRoom.customerId.lastName}`
                    : activeRoom.customerId?.email || "Customer"}
                </h2>
                                 <div className="flex items-center space-x-2">
                   <p className="text-sm text-gray-500">
                     {activeRoom.assignedAdmin ? "Assigned to admin" : "Unassigned"}
                     {onlineUsers.includes(activeRoom.customerId?._id) && (
                       <span className="ml-2 inline-flex items-center">
                         <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                         Online
                       </span>
                     )}
                   </p>
                   {/* Read Status Indicator */}
                   {messages.some(msg => msg.senderType === "admin" && isMessageReadByCustomer(msg)) && (
                     <div className="flex items-center space-x-1 text-xs text-blue-500">
                       <span>✓✓</span>
                       <span>Seen</span>
                     </div>
                   )}
                  {/* Socket Status Indicator */}
                  <div className={`flex items-center space-x-1 text-xs ${
                    isConnected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!activeRoom.assignedAdmin && (
              <button
                onClick={handleAutoAssign}
                disabled={activeRoom.isClosed}
                className="p-2 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
                title="Auto-assign to me"
              >
                <BiUserCheck className="w-5 h-5 text-green-600" />
              </button>
            )}
            <button
              onClick={handleTransfer}
              disabled={activeRoom.isClosed}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              title="Transfer chat"
            >
              <BiTransfer className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleClose}
              disabled={activeRoom.isClosed}
              className="p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
              title="Close chat"
            >
              <BiX className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 max-h-[calc(100vh-260px)] min-h-[calc(100vh-260px)]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <BiSend className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.senderType === "admin" ? "order-2" : "order-1"}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.senderType === "admin" 
                          ? "bg-blue-500 text-white rounded-br-md" 
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${msg.senderType === "admin" ? "text-right" : "text-left"} flex items-center justify-end space-x-1`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {msg.senderType === "admin" && (
                        <div className="flex items-center">
                          <span className={isMessageReadByCustomer(msg) ? "text-blue-300" : "text-gray-400"}>
                            {isMessageReadByCustomer(msg) ? "✓✓" : "✓"}
                          </span>
                        </div>
                      )}
                    </div>
                                         {msg.senderType === "admin" && isMessageReadByCustomer(msg) && (
                       <div className="text-xs text-blue-500 text-right flex items-center justify-end space-x-1">
                         <span>✓✓</span>
                         <span>Read {formatReadTime(msg)}</span>
                       </div>
                     )}
                     {msg.senderType === "admin" && !isMessageReadByCustomer(msg) && (
                       <div className="text-xs text-gray-400 text-right flex items-center justify-end space-x-1">
                         <span>✓</span>
                         <span>Delivered</span>
                       </div>
                     )}
                  </div>
                  {msg.senderType === "customer" && (
                    <div className="order-2 ml-2">
                      <img
                        src={activeRoom.customerId?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI0QzI4LjQxODMgMjQgMzIgMjAuNDE4MyAzMiAxNkMzMiAxMS41ODE3IDI4LjQxODMgOCAyNCA4QzE5LjU4MTcgOCAxNiAxMS41ODE3IDE2IDE2QzE2IDIwLjQxODMgMTkuNTgxNyAyNCAyNCAyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQwIDQwQzQwIDMyLjI2ODkgMzIuODM3IDI2IDI0IDI2QzE1LjE2MyAyNiA4IDMyLjI2ODkgOCA0MEg0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='}
                        alt="Customer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-xs lg:max-w-md order-1">
                    <div className="px-4 py-2 rounded-2xl bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">Customer is typing</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={activeRoom.isClosed}
              placeholder={activeRoom.isClosed ? "Chat is closed" : "Type a message..."}
              className={`flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                activeRoom.isClosed ? "bg-gray-100 cursor-not-allowed" : "bg-white"
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || activeRoom.isClosed}
              className={`p-3 rounded-full transition-colors ${
                !activeRoom.isClosed && inputMessage.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <BiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagePage;
