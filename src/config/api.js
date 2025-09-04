// API Configuration
export const API_CONFIG = {
  // Base API URI - defaults to localhost:3000 if not set in environment
  BASE_URI: import.meta.env.VITE_API_URI || "http://localhost:3000",
  
  // API endpoints
  ENDPOINTS: {
    // User endpoints
    USER_ROOMS: (userId) => `/api/user/rooms/${userId}`,
    USER_MESSAGE: (roomId) => `/api/user/rooms/${roomId}/message`,
    
    // Admin endpoints
    ADMIN_ROOMS: "/api/rooms",
    ADMIN_ROOM: (roomId) => `/api/rooms/${roomId}`,
    ADMIN_MESSAGE: (roomId) => `/api/rooms/${roomId}/message`,
    ADMIN_TRANSFER: (roomId) => `/api/rooms/${roomId}/transfer`,
    ADMIN_CLOSE: (roomId) => `/api/rooms/${roomId}/close`,
  },
  
  // Socket.IO configuration
  SOCKET: {
    CONNECTION_OPTIONS: {
      auth: {
        token: localStorage.getItem("accessToken") || localStorage.getItem("adminRefreshToken")
      }
    }
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URI}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Axios instance with default configuration
import axios from 'axios';

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URI,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('adminRefreshToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('accessToken');
      localStorage.removeItem('adminRefreshToken');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);
