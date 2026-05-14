import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";
import { io } from "socket.io-client";

const UserChatContext = createContext();

export const useUserChat = () => {
  const context = useContext(UserChatContext);
  if (!context) {
    throw new Error("useUserChat must be used within a UserChatProvider");
  }
  return context;
};

export const UserChatProvider = ({ children }) => {
  const { user, authRequest, isLoggedIn, getAuthHeader } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageNotifications, setNewMessageNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // AI mode states
  const [chatMode, setChatMode] = useState("support");
  const [aiMessages, setAiMessages] = useState([
    { _id: "ai_welcome", senderType: "assistant", text: "Hi! I'm your AI shopping assistant. I can track orders, compare products, or recommend items for you. What do you need?", createdAt: new Date().toISOString() }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const API_URI = import.meta.env.VITE_API_URI ;

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // --- Helper function to show notification ---
  const showMessageNotification = (message) => {
    const adminName = assignedAdmin?.firstName || assignedAdmin?.lastName || 'Admin';
    const notification = {
      id: Date.now(),
      message: message.text,
      sender: message.senderType === 'admin' ? adminName : 'You',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setNewMessageNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications
    setShowNotification(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // --- Show browser notification ---
  const showBrowserNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const adminName = assignedAdmin?.firstName || assignedAdmin?.name || 'Admin';
      const title = `💬 New message from ${adminName}`;
      const options = {
        body: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `user-chat-${activeRoom?._id}`,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          roomId: activeRoom?._id,
          messageId: message._id,
          senderType: message.senderType,
          timestamp: new Date().toISOString()
        },
        actions: [
          {
            action: 'open',
            title: '📱 Open Chat',
            icon: '/favicon.ico'
          },
          {
            action: 'mark_read',
            title: '✅ Mark Read',
            icon: '/favicon.ico'
          },
          {
            action: 'dismiss',
            title: '❌ Dismiss',
            icon: '/favicon.ico'
          }
        ]
      };
      
      const notification = new Notification(title, options);
      
      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        setIsOpen(true);
        notification.close();
      };
      
      // Handle notification actions
      notification.onactionclick = (event) => {
        event.preventDefault();
        if (event.action === 'open') {
          window.focus();
          setIsOpen(true);
        } else if (event.action === 'mark_read') {
          // Mark messages as read via socket
          if (socket && socket.connected && activeRoom?._id) {
            socket.emit("markMessagesAsRead", {
              roomId: activeRoom._id,
              readerType: "customer",
              readerId: user._id
            });
          }
        }
        notification.close();
      };
      
      // Auto-close notification after 15 seconds
      setTimeout(() => {
        notification.close();
      }, 15000);
    }
  };

  // --- Socket.IO connection ---
  useEffect(() => {
    if (!user?._id || !isLoggedIn) return;
    
    // Prevent multiple socket connections
    if (socket && socket.connected) {
      console.log("Socket already connected, skipping reconnection");
      return;
    }

    console.log("Creating new socket connection");
    const socketClient = io(API_URI, {
      auth: { token: localStorage.getItem("accessToken") },
      forceNew: false, // Reuse existing connection if available
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    socketClient.on("connect", () => {
      console.log("User socket connected");
      setIsConnected(true);
      socketClient.emit("joinUserRoom", user._id);
      setError(null);
    });

    socketClient.on("messageReceived", (message) => {
      console.log("Message received via socket:", message);
      
      // Check if message already exists to prevent duplication
      setMessages((prev) => {
        const messageExists = prev.some(msg => 
          msg._id === message._id || 
          (msg.senderId === message.senderId && 
           msg.text === message.text && 
           Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
        );
        
        if (messageExists) {
          console.log("Message already exists, not adding duplicate");
          return prev;
        }
        
        // Ensure message has proper structure with unique _id
        const cleanMessage = {
          _id: message._id || `temp_${Date.now()}_${Math.random()}`,
          senderId: message.senderId,
          senderType: message.senderType || 'customer',
          text: message.text,
          reaction: message.reaction || "",
          readBy: Array.isArray(message.readBy) ? message.readBy : [],
          createdAt: message.createdAt || new Date()
        };
        
        console.log("Adding new message via socket:", cleanMessage);
        return [...prev, cleanMessage];
      });
      
      // Show notification if chat is not open
      if (!isOpen) {
        showMessageNotification(message);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        showBrowserNotification(message);
      }
    });

    // Handle read status updates via socket
    socketClient.on("readStatusUpdated", (data) => {
      console.log("👁️ Read status updated:", data);
      
      // Update messages with read status
      setMessages(prev => prev.map(msg => ({
        ...msg,
        readBy: msg.readBy || []
      })));
      
      // Update active room with last read time
      if (activeRoom?._id === data.roomId) {
        setActiveRoom(prev => ({
          ...prev,
          lastReadAt: data.readAt
        }));
      }
    });

    socketClient.on("messagesRead", (data) => {
      console.log("Messages read:", data);
      setMessages(prev => prev.map(msg => ({
        ...msg,
        readBy: msg.readBy || []
      })));
    });

    socketClient.on("onlineStatusChanged", (data) => {
      console.log("Online status changed:", data);
      if (data.userId === activeRoom?.assignedAdmin?._id) {
        setIsOnline(data.isOnline);
      }
    });

    socketClient.on("roomAssigned", (data) => {
      console.log("Room assigned:", data);
      if (data.roomId === activeRoom?._id) {
        setAssignedAdmin({
          _id: data.adminId,
          firstName: data.adminName
        });
      }
    });

    // Handle room updates silently via socket
    socketClient.on("roomUpdated", (data) => {
      console.log("Room updated via socket:", data);
      if (data.roomId === activeRoom?._id) {
        setActiveRoom(prev => ({ ...prev, ...data.updates }));
        if (data.updates.assignedAdmin) {
          setAssignedAdmin(data.updates.assignedAdmin);
        }
      }
    });

    // Handle message status updates silently via socket
    socketClient.on("messageStatusUpdated", (data) => {
      console.log("Message status updated via socket:", data);
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, ...data.updates }
          : msg
      ));
    });

    // Handle message confirmation (replace temp messages with real ones)
    socketClient.on("messageConfirmed", (data) => {
      console.log("Message confirmed via socket:", data);
      setMessages(prev => prev.map(msg => 
        msg._id === data.tempId 
          ? { ...msg, _id: data.realId, ...data.updates }
          : msg
      ));
    });

    socketClient.on("userTyping", (data) => {
      console.log("User typing:", data);
      // Handle typing indicator from admin
      if (data.senderType === "admin" && data.isTyping) {
        setIsTyping(true);
      } else if (data.senderType === "admin" && !data.isTyping) {
        setIsTyping(false);
      }
    });

    socketClient.on("roomClosed", () => {
      setError("Chat room has been closed by admin");
    });

    socketClient.on("disconnect", () => {
      console.log("User socket disconnected");
      setIsConnected(false);
      setError("Connection lost");
    });

    socketClient.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setIsConnected(false);
      setError("Connection error");
    });

    setSocket(socketClient);

    return () => {
      if (socketClient) {
        socketClient.disconnect();
      }
    };
  }, [user?._id, isLoggedIn]); // Removed API_URI from dependencies to prevent reconnections

  // --- Fetch or create chat room (socket-first approach) ---
  const fetchRoom = React.useCallback(async () => {
    try {
      console.log("fetchRoom called - using socket-first approach");
      setIsLoading(true);
      setError(null);
      
      // Check if user is logged in
      if (!user?._id || !isLoggedIn) {
        console.log("User not logged in, skipping room fetch");
        setIsLoading(false);
        return;
      }

      // First try to get room via socket if connected
      if (socket && socket.connected) {
        console.log("Requesting room via socket");
        socket.emit("getRoomData", { userId: user._id });
        
        // Set a timeout for socket response
        const socketTimeout = setTimeout(() => {
          console.log("Socket timeout, falling back to API");
          fallbackToAPI();
        }, 3000);

        // Listen for socket response
        const handleRoomData = (roomData) => {
          clearTimeout(socketTimeout);
          socket.off("roomDataReceived", handleRoomData);
          
          if (roomData && roomData._id) {
            console.log("Room data received via socket:", roomData);
            processRoomData(roomData);
          } else {
            console.log("No room data from socket, falling back to API");
            fallbackToAPI();
          }
        };

        socket.on("roomDataReceived", handleRoomData);
        return;
      }

      // Fallback to API if socket not available
      fallbackToAPI();

      async function fallbackToAPI() {
        try {
          console.log("Fetching room via API for user:", user._id);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 8000)
          );
          
          const fetchPromise = authRequest(`${API_URI}/api/user/rooms/${user._id}`);
          const room = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (room && room._id) {
            processRoomData(room);
          } else {
            setError("No room data received from server");
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error fetching room via API:", err);
          setError(err.message === 'Request timeout' ? "Request timed out. Please try again." : err.response?.data?.message || "Failed to load chat");
          setIsLoading(false);
        }
      }

      function processRoomData(room) {
        console.log("Processing room data:", room);
        setActiveRoom(room);
        
        // Process messages
        const cleanMessages = (room.messages || [])
          .filter(msg => msg && msg.text && msg.senderId)
          .map(msg => ({
            _id: msg._id || `msg_${Date.now()}_${Math.random()}`,
            senderId: msg.senderId,
            senderType: msg.senderType || 'customer',
            text: msg.text,
            reaction: msg.reaction || "",
            readBy: Array.isArray(msg.readBy) ? msg.readBy : [],
            createdAt: msg.createdAt || new Date()
          }));
        
        setMessages(cleanMessages);
        setAssignedAdmin(room.assignedAdmin);
        setIsLoading(false);
        
        // Join chat room via socket
        if (socket && room._id) {
          console.log("Joining chat room via socket:", room._id);
          socket.emit("joinChatRoom", { 
            roomId: room._id, 
            userId: user._id, 
            userType: "customer" 
          });
        }
      }

    } catch (err) {
      console.error("Error in fetchRoom:", err);
      setError("Failed to load chat");
      setIsLoading(false);
    }
  }, [user?._id, authRequest, API_URI, socket, isLoggedIn]);

  // --- Single effect to handle room fetching and loading state ---
  useEffect(() => {
    // Only fetch when chat is opened and we don't have a room yet
    if (!isOpen || !user?._id || !isLoggedIn) {
      return;
    }

    // Check if we already have a valid room for this user
    const roomCustomerId = typeof activeRoom?.customerId === 'object' ? activeRoom.customerId._id : activeRoom?.customerId;
    if (activeRoom && activeRoom._id && roomCustomerId === user._id) {
      console.log("Room already exists for this user");
      setIsLoading(false);
      return;
    }

    // Only fetch if we don't have a room and we're not already loading
    if (!activeRoom && !isLoading) {
      console.log("Fetching room for user:", user._id);
      fetchRoom();
    }
  }, [isOpen, user?._id, isLoggedIn, activeRoom]); // Simplified dependencies

  // --- Clear loading state when we have valid room data ---
  useEffect(() => {
    if (activeRoom && activeRoom._id && isLoading) {
      console.log("Clearing loading state - room data received");
      setIsLoading(false);
    }
  }, [activeRoom, isLoading]);

  // --- Join room when socket is ready ---
  useEffect(() => {
    if (socket && activeRoom?._id && isConnected && isOpen) {
      console.log("Joining room with socket:", activeRoom._id);
      socket.emit("joinChatRoom", { 
        roomId: activeRoom._id, 
        userId: user._id, 
        userType: "customer" 
      });

      // Immediately mark messages as read (optimistic) when opening
      socket.emit("markMessagesAsRead", {
        roomId: activeRoom._id,
        readerType: "customer",
        readerId: user._id
      });

      // Optimistic UI: mark all admin messages as read locally immediately
      setMessages(prev => prev.map(msg => {
        if (msg.senderType === 'admin' && !(msg.readBy || []).some(r => r.readerType === 'customer')) {
          return {
            ...msg,
            readBy: [
              ...(Array.isArray(msg.readBy) ? msg.readBy : []),
              { readerType: 'customer', readerId: user._id, readAt: new Date().toISOString() }
            ]
          };
        }
        return msg;
      }));
    }
  }, [socket, activeRoom?._id, isConnected, user?._id, isOpen]);

  // --- Scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages]);

  // --- Send AI message ---
  const sendAIMessage = React.useCallback(async (textToSend) => {
    if (!textToSend?.trim()) return;
    const userMsg = { _id: `user_${Date.now()}`, senderType: "customer", text: textToSend, createdAt: new Date().toISOString() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiError(null);
    setIsAiLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await axios.post(`${API_URI}/api/assistant/chat`, { message: textToSend }, { headers, timeout: 25000 });
      const assistantText = res?.data?.reply || "I could not generate a response right now.";
      setAiMessages(prev => [...prev, { _id: `ai_${Date.now()}`, senderType: "assistant", text: assistantText, createdAt: new Date().toISOString() }]);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to get AI response";
      setAiError(errMsg);
      setAiMessages(prev => [...prev, { _id: `ai_err_${Date.now()}`, senderType: "assistant", text: "Sorry, I encountered an error. Please try again or switch to Customer Care.", createdAt: new Date().toISOString() }]);
    } finally {
      setIsAiLoading(false);
    }
  }, [API_URI, getAuthHeader]);

  // --- Load AI chat history from server ---
  const fetchAIChat = React.useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get(`${API_URI}/api/assistant/history`, { headers, timeout: 10000 });
      const serverMessages = res?.data?.messages || [];
      if (serverMessages.length > 0) {
        const mapped = serverMessages.map(m => ({
          _id: m._id || `msg_${Date.now()}_${Math.random()}`,
          senderType: m.role === "user" ? "customer" : "assistant",
          text: m.content,
          createdAt: m.createdAt || new Date().toISOString(),
        }));
        setAiMessages(mapped);
      } else {
        // Reset to default welcome if empty
        setAiMessages([
          { _id: "ai_welcome", senderType: "assistant", text: "Hi! I'm your AI shopping assistant. I can track orders, compare products, or recommend items for you. What do you need?", createdAt: new Date().toISOString() }
        ]);
      }
    } catch {
      // Keep existing messages on error
    }
  }, [API_URI, getAuthHeader]);

  // --- Clear AI chat on server ---
  const clearAIChat = React.useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      await axios.delete(`${API_URI}/api/assistant/clear`, { headers, timeout: 10000 });
      setAiMessages([
        { _id: "ai_welcome", senderType: "assistant", text: "Chat cleared! Ask me anything about your orders, products, or get recommendations.", createdAt: new Date().toISOString() }
      ]);
      setAiError(null);
    } catch (err) {
      setAiError(err?.response?.data?.message || "Failed to clear chat");
    }
  }, [API_URI, getAuthHeader]);

  const clearAiError = React.useCallback(() => setAiError(null), []);

  // --- Fetch AI chat history when switching to AI mode ---
  useEffect(() => {
    if (chatMode === "ai" && isOpen && user?._id) {
      fetchAIChat();
    }
  }, [chatMode, isOpen, user?._id, fetchAIChat]);

  // --- Send message ---
  const handleSend = React.useCallback(async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;
    // AI mode: bypass socket/room logic
    if (chatMode === "ai") {
      setInputMessage("");
      await sendAIMessage(trimmed);
      return;
    }
    console.log("handleSend called with:", { inputMessage, activeRoom, socket });
    if (!activeRoom?._id) {
      console.log("Validation failed: no active room");
      return;
    }
    
    try {
      setError(null);
      
      // Send message via socket first for immediate feedback
      if (socket) {
        const tempMessage = {
          _id: `temp_${Date.now()}`,
          senderId: user._id,
          senderType: "customer",
          text: inputMessage,
          reaction: "",
          readBy: [],
          createdAt: new Date()
        };
        
        // Add message to UI immediately for better UX
        setMessages(prev => [...prev, tempMessage]);
        
        // Emit via socket
        socket.emit("sendMessage", { 
          roomId: activeRoom._id, 
          senderId: user._id, 
          senderType: "customer", 
          text: inputMessage 
        });
      }
      
      setInputMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    }
  }, [inputMessage, activeRoom?._id, socket, user?._id, chatMode, sendAIMessage]);

  // --- Mark messages as read (with debouncing) ---
  const markAsReadTimeoutRef = useRef(null);
  const markAsRead = React.useCallback(async () => {
    if (!activeRoom?._id) return;
    
    // Clear existing timeout
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }
    
    // Debounce mark as read to prevent excessive socket emissions
    markAsReadTimeoutRef.current = setTimeout(() => {
      try {
        // Mark messages as read via socket instead of API
        if (socket && socket.connected) {
          socket.emit("markMessagesAsRead", {
            roomId: activeRoom._id,
            readerType: "customer",
            readerId: user._id
          });
        }
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    }, 300); // 300ms delay
  }, [activeRoom?._id, socket, user?._id]);

  // --- Update online status ---
  const updateOnlineStatus = React.useCallback(async (status) => {
    if (!activeRoom?._id) return;
    
    try {
      // Update online status via socket
      if (socket) {
        socket.emit("updateOnlineStatus", {
          roomId: activeRoom._id,
          userId: user._id,
          isOnline: status
        });
      }
    } catch (err) {
      console.error("Error updating online status:", err);
    }
  }, [activeRoom?._id, socket, user?._id]);

  // --- Send typing indicator ---
  const sendTypingIndicator = React.useCallback((isTyping) => {
    if (!activeRoom?._id || !socket) return;
    
    try {
      if (isTyping) {
        socket.emit("typingStart", {
          roomId: activeRoom._id,
          senderId: user._id,
          senderType: "customer"
        });
      } else {
        socket.emit("typingStop", {
          roomId: activeRoom._id,
          senderId: user._id,
          senderType: "customer"
        });
      }
    } catch (err) {
      console.error("Error sending typing indicator:", err);
    }
  }, [activeRoom?._id, socket, user?._id]);

  // --- Open/Close chat ---
  const openChat = React.useCallback(() => {
    console.log("Opening chat");
    setIsOpen(true);
    setUnreadCount(0); // Clear unread count immediately
    
    // Only emit socket events if we have all required data
    if (socket && socket.connected && activeRoom?._id && user?._id) {
      console.log("Emitting chat open events for room:", activeRoom._id);
      
      // Batch socket emissions to reduce overhead
      socket.emit("joinChatRoom", { 
        roomId: activeRoom._id, 
        userId: user._id, 
        userType: "customer" 
      });
      
      socket.emit("markMessagesAsRead", {
        roomId: activeRoom._id,
        readerType: "customer",
        readerId: user._id
      });
      
      socket.emit("updateOnlineStatus", {
        roomId: activeRoom._id,
        userId: user._id,
        isOnline: true
      });
    }
  }, [socket, activeRoom?._id, user?._id]);
  
  const closeChat = React.useCallback(() => {
    console.log("Closing chat");
    setIsOpen(false);
    
    // Update online status via socket only if connected
    if (socket && socket.connected && activeRoom?._id && user?._id) {
      socket.emit("updateOnlineStatus", {
        roomId: activeRoom._id,
        userId: user._id,
        isOnline: false
      });
    }
  }, [socket, activeRoom?._id, user?._id]);

  // --- Clear error ---
  const clearError = React.useCallback(() => setError(null), []);

  // --- Retry loading chat (with throttling) ---
  const [lastRetryTime, setLastRetryTime] = useState(0);
  const retryLoadChat = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime;
    
    // Throttle retries to prevent spam (minimum 3 seconds between retries)
    if (timeSinceLastRetry < 3000) {
      console.log("Retry throttled - please wait");
      setError("Please wait before retrying");
      return;
    }
    
    console.log("Retrying to load chat");
    setLastRetryTime(now);
    setError(null);
    setIsLoading(false); // Reset loading state
    
    // Only clear room data if we don't have a valid room
    if (!activeRoom || !activeRoom._id) {
      setActiveRoom(null);
      setMessages([]);
      fetchRoom();
    } else {
      // If we have room data, just clear loading state
      setIsLoading(false);
    }
  }, [fetchRoom, lastRetryTime, activeRoom]);

  // --- Clear notifications ---
  const clearNotifications = React.useCallback(() => {
    setNewMessageNotifications([]);
    setShowNotification(false);
  }, []);

  // --- Cleanup timeouts on unmount ---
  useEffect(() => {
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    // State
    isOpen,
    inputMessage,
    messages,
    activeRoom,
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
    
    // Actions
    openChat,
    closeChat,
    setInputMessage,
    handleSend,
    clearError,
    clearNotifications,
    markAsRead,
    retryLoadChat,
    sendTypingIndicator,
    
    // AI mode
    chatMode,
    setChatMode,
    aiMessages,
    isAiLoading,
    aiError,
    sendAIMessage,
    clearAiError,
    fetchAIChat,
    clearAIChat,
    
    // Additional data for components
    socket,
    user,
  };

  return (
    <UserChatContext.Provider value={value}>
      {children}
    </UserChatContext.Provider>
  );
};
