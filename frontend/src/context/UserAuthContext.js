// frontend/src/context/UserAuthContext.js - Public User Authentication Context
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, userLogin, userSignup, userGoogleAuth, userLogout } from '../services/api';

// Create context
const UserAuthContext = createContext();

// Hook to use auth context
export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

// Auth Provider Component
export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ============================================
  // Check if user is logged in (on mount)
  // ============================================
  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const token = localStorage.getItem('userToken');

      if (token) {
        // Verify token and get user data
        const response = await getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Invalid token
          localStorage.removeItem('userToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Token invalid or expired
      localStorage.removeItem('userToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SIGNUP (Email/Password)
  // ============================================
  const signup = async (userData) => {
    try {
      const response = await userSignup(userData);

      if (response.success) {
        // Store token
        localStorage.setItem('userToken', response.data.token);

        // Set user
        setUser(response.data.user);
        setIsAuthenticated(true);

        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create account'
      };
    }
  };

  // ============================================
  // LOGIN (Email/Password)
  // ============================================
  const login = async (credentials) => {
    try {
      const response = await userLogin(credentials);

      if (response.success) {
        // Store token
        localStorage.setItem('userToken', response.data.token);

        // Set user
        setUser(response.data.user);
        setIsAuthenticated(true);

        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to login'
      };
    }
  };

  // ============================================
  // GOOGLE LOGIN
  // ============================================
  const googleLogin = async (googleData) => {
    try {
      const response = await userGoogleAuth(googleData);

      if (response.success) {
        // Store token
        localStorage.setItem('userToken', response.data.token);

        // Set user
        setUser(response.data.user);
        setIsAuthenticated(true);

        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to login with Google'
      };
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    try {
      await userLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user data
      localStorage.removeItem('userToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ============================================
  // UPDATE USER (after email verification, profile update, etc.)
  // ============================================
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // ============================================
  // REFRESH USER DATA
  // ============================================
  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    signup,
    login,
    googleLogin,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};
