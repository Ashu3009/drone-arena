// frontend/src/components/Auth/UserSignup.js - Public User Signup Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './UserAuth.css';
import droneIcon from '../../assets/drone.png';

const UserSignup = () => {
  const navigate = useNavigate();
  const { signup, googleLogin } = useUserAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid Indian phone number';
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
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone || undefined,
        location: {
          city: formData.city || undefined,
          state: formData.state || undefined
        }
      };

      const result = await signup(userData);

      if (result.success) {
        setSuccessMessage('Account created successfully! Please check your email to verify your account.');

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setErrors({ submit: result.message || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Signup error:', error);
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
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1000);
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
            <h1 className="auth-title"><img src={droneIcon} alt="drone" style={{width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '10px'}} /> Join DroneNova Arena</h1>
            <p className="auth-subtitle">Create your account to participate in tournaments</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="auth-success-message">
              <span className="success-icon">✅</span>
              {successMessage}
            </div>
          )}

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
                  text="signup_with"
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

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
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            {/* Phone (Optional) */}
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                maxLength="10"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            {/* Location (Optional) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City (Optional)</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  placeholder="Your city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State (Optional)</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  placeholder="Your state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
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

export default UserSignup;
