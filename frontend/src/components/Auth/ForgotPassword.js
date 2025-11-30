// frontend/src/components/Auth/ForgotPassword.js - Forgot Password Page
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import './UserAuth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // ============================================
  // Validate Form
  // ============================================
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
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
    setSuccess(false);

    try {
      const response = await forgotPassword(email.trim().toLowerCase());

      if (response.success) {
        setSuccess(true);
        setMessage(response.message || 'Password reset link has been sent to your email.');
        setEmail(''); // Clear email field
      } else {
        setErrors({ submit: response.message || 'Failed to send reset email' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({
        submit: error.response?.data?.message || 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-auth-container">
      <div className="user-auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">🔐 Forgot Password?</h1>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="auth-success-message">
            <span className="success-icon">✅</span>
            {message}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="auth-error-message">
            <span className="error-icon">❌</span>
            {errors.submit}
          </div>
        )}

        {/* Form */}
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              disabled={loading || success}
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Sending...
              </>
            ) : success ? (
              'Email Sent!'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="auth-bg-decoration"></div>
    </div>
  );
};

export default ForgotPassword;
