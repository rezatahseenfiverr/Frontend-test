import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URI;

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [address, setAddress] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [redirectPath, setRedirectPath] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pickDefaultPaymentMethod = (methods = []) =>
    methods.find((m) => m.isDefault) || methods[0] || null;

  const isTokenExpired = (token) => {
    try {
      const { exp } = jwtDecode(token);
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await axios.post(`${API}/api/refresh-token`, { token: refreshToken });
      const newAccessToken = response.data.accessToken;

      localStorage.setItem('accessToken', newAccessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`; // 🔐 Set default

      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      throw error;
    }
  };

  const getAccessToken = async () => {
    let token = localStorage.getItem('accessToken');
    if (!token || isTokenExpired(token)) {
      token = await refreshAccessToken();
    }
    return token;
  };

  const getAuthHeader = async () => {
    const token = await getAccessToken();
    return { Authorization: `Bearer ${token}` };
  };

  const authRequest = async (url, options = {}) => {
    let accessToken = localStorage.getItem('accessToken');
    if (!accessToken || isTokenExpired(accessToken)) {
      accessToken = await refreshAccessToken();
    }

    try {
      const res = await axios({
        ...options,
        url,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return res.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          const retry = await axios({
            ...options,
            url,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return retry.data;
        } catch (refreshError) {
          logout();
          throw refreshError;
        }
      }
      throw error;
    }
  };

  const fetchUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // No token: keep app in guest mode without redirecting
        setUser(null);
        setIsLoggedIn(false);
        delete axios.defaults.headers.common.Authorization;
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const freshUser = await authRequest(`${API}/api/user/profile`, { method: 'GET' });
      setUser(freshUser);
      setIsLoggedIn(true);

      const addr = freshUser.address || null;
      const methods = freshUser.paymentMethods || [];

      setAddress(addr);
      setPaymentMethods(methods);
      setDefaultPaymentMethod(pickDefaultPaymentMethod(methods));
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Stay in guest mode instead of forcing redirect to login for public pages
      setUser(null);
      setIsLoggedIn(false);
      delete axios.defaults.headers.common.Authorization;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (redirectPath) {
      navigate(redirectPath);
      setRedirectPath(null);
    }
  }, [redirectPath, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (token && isTokenExpired(token)) {
        logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = async (emailOrPhone, password) => {
    try {
      const response = await axios.post(`${API}/api/login`, { emailOrPhone, password });
      const { user: loggedInUser, accessToken, refreshToken } = response.data;

      setUser(loggedInUser);
      setIsLoggedIn(true);

      const addr = loggedInUser.address || null;
      const methods = loggedInUser.paymentMethods || [];

      setAddress(addr);
      setPaymentMethods(methods);
      setDefaultPaymentMethod(pickDefaultPaymentMethod(methods));

      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setRedirectPath('/');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      // Check if this is a post-registration login (has accessToken)
      if (registerData.accessToken && registerData.refreshToken && registerData.user) {
        // This is a post-registration login, not a new registration
        setUser(registerData.user);
        setIsLoggedIn(true);
        setAddress(registerData.user.address || null);
        setPaymentMethods(registerData.user.paymentMethods || []);
        setDefaultPaymentMethod(registerData.user.paymentMethods?.find(pm => pm.isDefault) || null);
        
        localStorage.setItem('user', JSON.stringify(registerData.user));
        localStorage.setItem('accessToken', registerData.accessToken);
        localStorage.setItem('refreshToken', registerData.refreshToken);
        
        axios.defaults.headers.common.Authorization = `Bearer ${registerData.accessToken}`;
        setRedirectPath('/');
        return;
      }
      
      // Legacy registration flow (should not be used anymore)
      await axios.post(`${API}/api/register`, registerData);
      setRedirectPath('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        await axios.post(`${API}/api/logout`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (error) {
      console.warn('Logout API failed:', error);
    }

    setUser(null);
    setIsLoggedIn(false);
    setAddress(null);
    setPaymentMethods([]);
    setDefaultPaymentMethod(null);

    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    delete axios.defaults.headers.common.Authorization;
    setRedirectPath('/login');
  };

  const updateProfile = async (newData) => {
    await authRequest(`${API}/api/profile`, { method: 'PATCH', data: newData });
    await fetchUser();
  };

  const updateAddress = async (newAddress) => {
    await authRequest(`${API}/api/address`, { method: 'PATCH', data: { address: newAddress } });
    await fetchUser();
  };

  const replacePaymentMethods = async (methods) => {
    await authRequest(`${API}/api/payment-methods`, { method: 'PATCH', data: { paymentMethods: methods } });
    await fetchUser();
  };

  const addPaymentMethod = async (method) => {
    await authRequest(`${API}/api/payment-methods`, { method: 'POST', data: method });
    await fetchUser();
  };

  const removePaymentMethod = async (methodId) => {
    await authRequest(`${API}/api/payment-methods/${methodId}`, { method: 'DELETE' });
    await fetchUser();
  };

  const makeDefaultPaymentMethod = async (methodId) => {
    await authRequest(`${API}/api/payment-methods/${methodId}/default`, { method: 'PATCH' });
    await fetchUser();
  };

  const editPaymentMethod = async (methodId, updates) => {
    await authRequest(`${API}/api/payment-methods/${methodId}`, { method: 'PATCH', data: updates });
    await fetchUser();
  };

  

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn,
        address,
        paymentMethods,
        defaultPaymentMethod,
        errorMessage,
        login,
        logout,
        register,
        authRequest,
        updateProfile,
        updateAddress,
        replacePaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        makeDefaultPaymentMethod,
        editPaymentMethod,
        getAuthHeader, // 👈 exposed for custom requests
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

