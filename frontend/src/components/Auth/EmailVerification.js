// frontend/src/components/Auth/EmailVerification.js - Email Verification Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyUserEmail } from '../../services/api';
import './UserAuth.css';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await verifyUserEmail(token);

      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message ||
        'Invalid or expired verification token'
      );
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        {status === 'verifying' && (
          <>
            <div className="loading-spinner"></div>
            <h2 className="verification-title">Verifying Your Email...</h2>
            <p className="verification-message">
              Please wait while we verify your email address
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon">✅</div>
            <h2 className="verification-title">Email Verified!</h2>
            <p className="verification-message">
              {message}
            </p>
            <p className="verification-message">
              Redirecting to login page...
            </p>
            <Link to="/login" className="verification-btn">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon">❌</div>
            <h2 className="verification-title">Verification Failed</h2>
            <p className="verification-message">
              {message}
            </p>
            <p className="verification-message">
              The verification link may be invalid or expired.
            </p>
            <Link to="/signup" className="verification-btn">
              Sign Up Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
