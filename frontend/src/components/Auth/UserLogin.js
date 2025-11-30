// frontend/src/components/Auth/UserLogin.js - Public User Login Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './UserAuth.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useUserAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ============================================
  // Handle Input Change
  // ============================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  // ============================================
  // Validate Form
  // ============================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // Handle Form Submit
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const result = await login(credentials);

      if (result.success) {
        // Redirect to home page
        navigate('/');
      } else {
        setErrors({ submit: result.message || 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Handle Google Login Success
  // ============================================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);

      // Decode JWT from Google
      const decoded = jwtDecode(credentialResponse.credential);

      const googleData = {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        photo: decoded.picture
      };

      const result = await googleLogin(googleData);

      if (result.success) {
        navigate('/');
      } else {
        setErrors({ submit: result.message || 'Failed to login with Google' });
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({ submit: 'Failed to login with Google' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Handle Google Login Failure
  // ============================================
  const handleGoogleFailure = () => {
    setErrors({ submit: 'Google login failed. Please try again.' });
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <div className="user-auth-container">
        <div className="user-auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">🚁 Welcome Back!</h1>
            <p className="auth-subtitle">Login to your DroneNova Arena account</p>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="auth-error-message">
              <span className="error-icon">❌</span>
              {errors.submit}
            </div>
          )}

          {/* Google Login - Only show if Client ID is configured */}
          {process.env.REACT_APP_GOOGLE_CLIENT_ID && (
            <>
              <div className="google-login-section">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  text="signin_with"
                  shape="rectangular"
                  theme="filled_blue"
                  size="large"
                  width="100%"
                />
              </div>

              {/* Divider */}
              <div className="auth-divider">
                <span>OR</span>
              </div>
            </>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password-link">
              <Link to="/forgot-password" className="auth-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Logging In...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="auth-bg-decoration"></div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default UserLogin;
