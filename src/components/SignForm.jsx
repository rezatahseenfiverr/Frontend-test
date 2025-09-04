import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { faEye, faEyeSlash, faEnvelope, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { api } from '../config/api';

function SignForm() {
  const { register } = useContext(UserContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

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
      const response = await api.post('/api/send-registration-otp', { email: trimmedEmail });
      setSuccess(response.data.message);
      setIsOtpSent(true);
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
        type: 'registration'
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUserName = userName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedOtp = otp.trim();

    // Client-side validations
    if (!trimmedFirst || !trimmedLast) {
      setError('First name and last name are required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    // Phone number validation - more flexible
    const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('Please enter a valid Bangladeshi phone number (e.g., +8801XXXXXXXXX or 01XXXXXXXXX)');
      return;
    }
    
    // Normalize phone number to +880 format
    let normalizedPhone = trimmedPhone;
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+880' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('880')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+880')) {
      normalizedPhone = '+880' + normalizedPhone;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!isOtpSent) {
      setError('Please send OTP first');
      return;
    }
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Auto-suggest username if empty
    const finalUserName =
      trimmedUserName ||
      `${trimmedFirst}.${trimmedLast}`.toLowerCase().replace(/\s+/g, '');

    const formData = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      userName: finalUserName,
      email: trimmedEmail,
      phoneNumber: normalizedPhone,
      password,
      otp: trimmedOtp,
    };

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/verify-otp-and-register', formData);
      
      // Use the response data instead of formData for login
      if (response.data.accessToken && response.data.refreshToken) {
        // Call the register function from context with the actual user data
        await register({
          email: response.data.user.email,
          password: password, // Use the password for login
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user
        });
      }
      
      setSuccess('Registration successful! Redirecting...');
      // Optionally: clear form or navigate handled by context/route
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
              Sign Up
            </h1>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {success && <p className="text-green-500 text-center">{success}</p>}
            <form className="space-y-4 md:space-y-6" onSubmit={handleSignUp} noValidate>
              <div>
                <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="First Name"
                  autoComplete="given-name"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Last Name"
                  autoComplete="family-name"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  placeholder="Username"
                  autoComplete="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Email
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
              
              {isOtpSent && (
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
              )}
              <div>
                <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                  inputMode="tel"
                  title="Enter Bangladeshi phone number (e.g., 01XXXXXXXXX or +8801XXXXXXXXX)"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Bangladeshi mobile number (e.g., 01712345678 or +8801712345678)
                </p>
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <NavLink to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                  Log In
                </NavLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignForm;