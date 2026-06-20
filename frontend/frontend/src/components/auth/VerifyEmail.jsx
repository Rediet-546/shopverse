import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyEmail, resendVerification, clearError } from '../../redux/slices/authSlice';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../../styles/auth.css';

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isVerifying, error } = useSelector((state) => state.auth);

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Get token from URL
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      toast.error('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        await dispatch(verifyEmail(token)).unwrap();
        setStatus('success');
      } catch (error) {
        setStatus('error');
        // Check if error is about expired token
        if (error?.includes('expired')) {
          toast.error('Verification link has expired. Please request a new one.');
        }
      }
    };

    verify();

    return () => {
      dispatch(clearError());
    };
  }, [token, dispatch]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setIsResending(true);
      await dispatch(resendVerification(email)).unwrap();
      toast.success('Verification email resent successfully');
    } catch (error) {
      // Error handled by thunk
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Verifying Email</h1>
            <p>Please wait while we verify your email address</p>
          </div>
          <div className="auth-loading">
            <FaSpinner className="spinner-icon" />
            <p>Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Email Verified!</h1>
            <p>Your email has been verified successfully</p>
          </div>
          <div className="auth-success">
            <div className="success-icon">
              <FaCheckCircle style={{ color: '#22c55e', fontSize: '64px' }} />
            </div>
            <p>
              Thank you for verifying your email address. You can now login to your account.
            </p>
            <div className="auth-buttons">
              <Link to="/login" className="auth-button">
                Login Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verification Failed</h1>
          <p>We couldn't verify your email address</p>
        </div>
        <div className="auth-error">
          <div className="error-icon">
            <FaTimesCircle style={{ color: '#ef4444', fontSize: '64px' }} />
          </div>
          <p>
            {error || 'The verification link is invalid or has expired.'}
          </p>
          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Enter your email to resend verification</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isResending}
              />
            </div>
            <button
              type="button"
              className={`auth-button ${isResending ? 'loading' : ''}`}
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            <div className="auth-footer">
              <Link to="/login">Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;