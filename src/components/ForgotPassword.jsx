import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { api } from '../config/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password

  // OTP countdown effect
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    } else {
      setCanResendOtp(true);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Send OTP
  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/send-forgot-password-otp', { email: trimmedEmail });
      setSuccess(response.data.message);
      setIsOtpSent(true);
      setStep(2);
      setOtpCountdown(60); // 60 seconds countdown
      setCanResendOtp(false);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setSuccess('');

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/resend-otp', { 
        email: email.trim().toLowerCase(),
        type: 'password_reset'
      });
      setSuccess(response.data.message);
      setOtpCountdown(60);
      setCanResendOtp(false);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP and proceed to password reset
  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    const trimmedOtp = otp.trim();
    
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsSubmitting(true);
      // Just verify OTP first, don't reset password yet
      const response = await api.post('/api/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: trimmedOtp,
        type: 'password_reset'
      });
      
      setSuccess('OTP verified successfully. Please enter your new password.');
      setStep(3);
    } catch (err) {
      const message = err?.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Enhanced password validation
    if (!trimmedNewPassword) {
      setError('New password is required');
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (trimmedNewPassword.length > 128) {
      setError('Password must be less than 128 characters');
      return;
    }

    if (!trimmedConfirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/verify-forgot-password-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: trimmedNewPassword
      });
      
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          Barvella
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex items-center">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="mr-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Enter Verification Code'}
                {step === 3 && 'Reset Password'}
              </h1>
            </div>
            
            {error && <p className="text-red-500 text-center">{error}</p>}
            {success && <p className="text-green-500 text-center">{success}</p>}

            {/* Step 1: Email Input */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={isSubmitting || !email.trim() || otpCountdown > 0}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 whitespace-nowrap"
                    >
                      {otpCountdown > 0 ? `${otpCountdown}s` : 'Send OTP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </p>
                <div>
                  <label htmlFor="otp" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Verification Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 text-center text-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResendOtp || isSubmitting}
                      className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg focus:ring-4 focus:outline-none focus:ring-primary-300 dark:text-primary-500 dark:hover:text-primary-400 dark:focus:ring-primary-800 whitespace-nowrap border border-primary-600 dark:border-primary-500"
                    >
                      Resend
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={isSubmitting || !otp.trim() || otp.length !== 6}
                  className="w-full text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}

            {/* Step 3: New Password Input */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Enter your new password below
                </p>
                <div>
                  <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isSubmitting || !newPassword.trim() || !confirmPassword.trim() || newPassword !== confirmPassword}
                  className="w-full text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            )}

            <p className="text-sm font-light text-gray-500 dark:text-gray-400 text-center">
              Remember your password?{' '}
              <NavLink to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                Log In
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
