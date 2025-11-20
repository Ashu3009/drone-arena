import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(true);

  // Set axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get admin data
      verifyToken();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Verify token and get admin info
  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      if (response.data.success) {
        setAdmin(response.data.admin);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { token: newToken, admin: adminData } = response.data;
        setToken(newToken);
        setAdmin(adminData);
        localStorage.setItem('adminToken', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Create admin (superadmin only)
  const createAdmin = async (username, password, role = 'admin') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/create-admin`, {
        username,
        password,
        role
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Create admin failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create admin'
      };
    }
  };

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    createAdmin,
    isAuthenticated: !!token && !!admin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
