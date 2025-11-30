// frontend/src/components/Auth/ResetPassword.js - Reset Password Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import './UserAuth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ submit: 'Invalid reset link' });
    }
  }, [token]);

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await resetPassword(token, formData.password);

      if (response.success) {
        setSuccess(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrors({ submit: response.message || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Invalid or expired reset token'
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Success State
  // ============================================
  if (success) {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-icon">✅</div>
          <h2 className="verification-title">Password Reset Successful!</h2>
          <p className="verification-message">
            Your password has been reset successfully. You can now login with your new password.
          </p>
          <p className="verification-message">
            Redirecting to login page...
          </p>
          <Link to="/login" className="verification-btn">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-auth-container">
      <div className="user-auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">🔑 Reset Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="auth-error-message">
            <span className="error-icon">❌</span>
            {errors.submit}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* New Password */}
          <div className="form-group">
            <label className="form-label">
              New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter new password (min. 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
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
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
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
                Resetting Password...
              </>
            ) : (
              'Reset Password'
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

export default ResetPassword;
