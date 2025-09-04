import React, { useState, useContext, useEffect, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaUserCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaTrash,
  FaStar,
  FaRegStar,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaGlobe,
  FaPlus,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaKey,
} from 'react-icons/fa';

const UserProfile = () => {
  const {
    user,
    address,
    paymentMethods,
    defaultPaymentMethod,
    updateProfile,
    updateAddress,
    addPaymentMethod,
    removePaymentMethod,
    makeDefaultPaymentMethod,
    editPaymentMethod,
  } = useContext(UserContext);

  // ---------- Local editable state ----------
  const initialFormData = useMemo(
    () => ({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      email: user?.email || '',
      userName: user?.userName || '',
      imageUrl: user?.imageUrl || '',
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || '',
      },
    }),
    [user, address]
  );

  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password update state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Email update state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [verificationStep, setVerificationStep] = useState('email'); // 'email' or 'otp'

  // Add payment method form state
  const [newPm, setNewPm] = useState({
    type: 'bkash',
    label: '',
    isDefault: false,
    brand: '',
    last4: '',
    expMonth: '',
    expYear: '',
    walletNumberMasked: '',
    msisdn: '',
  });

  // Edit existing payment method state
  const [editingPmId, setEditingPmId] = useState(null);
  const [editFields, setEditFields] = useState({});

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const toggleEditing = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Phone number validation function
  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return 'Phone number is required';
    }
    
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      return 'Phone number cannot be empty';
    }

    // Bangladeshi phone number regex (same as backend)
    const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return 'Invalid Bangladeshi phone number format. Please use format: 01XXXXXXXXX or +8801XXXXXXXXX';
    }

    return null; // No error
  };

  // Normalize phone number to +880 format
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return phoneNumber;
    
    let normalized = phoneNumber.trim();
    
    // Remove any non-digit characters except +
    normalized = normalized.replace(/[^\d+]/g, '');
    
    // Convert to +880 format
    if (normalized.startsWith('880')) {
      normalized = '+' + normalized;
    } else if (normalized.startsWith('0')) {
      normalized = '+880' + normalized.substring(1);
    } else if (normalized.startsWith('1') && normalized.length === 11) {
      normalized = '+880' + normalized;
    } else if (!normalized.startsWith('+880')) {
      normalized = '+880' + normalized;
    }
    
    return normalized;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData((prev) => {
      if (keys.length === 1) {
        return { ...prev, [name]: value };
      } else {
        const [outerKey, innerKey] = keys;
        return {
          ...prev,
          [outerKey]: {
            ...prev[outerKey],
            [innerKey]: value,
          },
        };
      }
    });

    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const saveChanges = async (field) => {
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      let valueToSave = formData[field];

      // Special handling for phone number
      if (field === 'phoneNumber') {
        const validationError = validatePhoneNumber(valueToSave);
        if (validationError) {
          setErrors({ [field]: validationError });
          setLoading(false);
          return;
        }
        valueToSave = normalizePhoneNumber(valueToSave);
      }

      if (field.startsWith('address.')) {
        const innerKey = field.split('.')[1];
        const nextAddress = {
          ...formData.address,
          [innerKey]: formData.address?.[innerKey],
        };
        await updateAddress(nextAddress);
      } else {
        await updateProfile({ [field]: valueToSave });
      }
      
      setIsEditing((prev) => ({ ...prev, [field]: false }));
      setSuccessMessage(`${formatLabel(field)} updated successfully!`);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      const errorMessage = error?.response?.data?.message || 'Could not save changes. Please try again.';
      setErrors({ [field]: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (label) =>
    label.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  // Password update functions
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const updatePassword = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Validate new password
      const passwordError = validatePassword(passwordData.newPassword);
      if (passwordError) {
        setErrors({ newPassword: passwordError });
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        setLoading(false);
        return;
      }

      // Call API to update password
      const response = await fetch('/api/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshResponse = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                
                // Retry the original request with new token
                const retryResponse = await fetch('/api/update-password', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshData.accessToken}`,
                  },
                  body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                  }),
                });
                
                const retryData = await retryResponse.json();
                
                if (!retryResponse.ok) {
                  throw new Error(retryData.message || 'Failed to update password');
                }
                
                setSuccessMessage('Password updated successfully!');
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                return;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Redirect to login if refresh fails
            window.location.href = '/login';
            return;
          }
        }
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccessMessage('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password update failed:', error);
      setErrors({ password: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Email update functions
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendEmailOTP = async () => {
    if (!validateEmail(emailData.newEmail)) {
      setErrors({ newEmail: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshResponse = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                
                // Retry the original request with new token
                const retryResponse = await fetch('/api/send-email-otp', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshData.accessToken}`,
                  },
                  body: JSON.stringify({
                    newEmail: emailData.newEmail,
                  }),
                });
                
                const retryData = await retryResponse.json();
                
                if (!retryResponse.ok) {
                  throw new Error(retryData.message || 'Failed to send OTP');
                }
                
                setOtpSent(true);
                setOtpTimer(60); // 60 seconds countdown
                setVerificationStep('otp');
                setSuccessMessage('Verification code sent to your new email!');
                return;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            setErrors({ email: 'Your session has expired. Please log in again to continue.' });
            setLoading(false);
            return;
          }
        }
        throw new Error(data.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      setOtpTimer(60); // 60 seconds countdown
      setVerificationStep('otp');
      setSuccessMessage('Verification code sent to your new email!');
    } catch (error) {
      console.error('Send OTP failed:', error);
      setErrors({ email: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async () => {
    if (!emailData.otp || emailData.otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit verification code' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
          otp: emailData.otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshResponse = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                
                // Retry the original request with new token
                const retryResponse = await fetch('/api/update-email', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshData.accessToken}`,
                  },
                  body: JSON.stringify({
                    newEmail: emailData.newEmail,
                    otp: emailData.otp,
                  }),
                });
                
                const retryData = await retryResponse.json();
                
                if (!retryResponse.ok) {
                  throw new Error(retryData.message || 'Failed to update email');
                }
                
                setSuccessMessage('Email updated successfully!');
                setShowEmailModal(false);
                setEmailData({ newEmail: '', otp: '' });
                setOtpSent(false);
                setOtpTimer(0);
                setVerificationStep('email');
                
                // Refresh user data
                window.location.reload();
                return;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            setErrors({ email: 'Your session has expired. Please log in again to continue.' });
            setLoading(false);
            return;
          }
        }
        throw new Error(data.message || 'Failed to update email');
      }

      setSuccessMessage('Email updated successfully!');
      setShowEmailModal(false);
      setEmailData({ newEmail: '', otp: '' });
      setOtpSent(false);
      setOtpTimer(0);
      setVerificationStep('email');
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Email update failed:', error);
      setErrors({ email: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field, label, value, icon, type = 'text') => (
    <div key={field} className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {icon}
        {formatLabel(label)}
        {field === 'phoneNumber' && (
          <div className="relative group">
            <FaInfoCircle className="text-gray-400 text-xs cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Format: 01XXXXXXXXX or +8801XXXXXXXXX
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}
      </label>
      {isEditing[field] ? (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type={type}
              name={field}
              value={value || ''}
              onChange={handleChange}
              className={`flex-1 rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm transition-all duration-200 ${
                errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={field === 'phoneNumber' ? '01XXXXXXXXX or +8801XXXXXXXXX' : `Enter ${formatLabel(label).toLowerCase()}`}
            />
            <button
              className="p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => saveChanges(field)}
              disabled={loading}
              title="Save"
            >
              <FaSave />
            </button>
            <button
              className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              onClick={() => {
                toggleEditing(field);
                setFormData(initialFormData); // Reset to original value
              }}
              title="Cancel"
            >
              <FaTimes />
            </button>
          </div>
          {errors[field] && (
            <div className="text-red-600 text-sm flex items-center gap-1">
              <FaExclamationTriangle className="text-xs" />
              {errors[field]}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
          <span className="text-gray-800 truncate">{value || 'Not provided'}</span>
          <button
            className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-all duration-200"
            onClick={() => toggleEditing(field)}
            title="Edit"
          >
            <FaEdit />
          </button>
        </div>
      )}
    </div>
  );

  // ---------- Payment methods helpers ----------
  const handleNewPmChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear payment method error when user starts typing
    if (errors.paymentMethod) {
      setErrors((prev) => ({ ...prev, paymentMethod: '' }));
    }
  };

  const resetNewPm = () =>
    setNewPm({
      type: 'bkash',
      label: '',
      isDefault: false,
      brand: '',
      last4: '',
      expMonth: '',
      expYear: '',
      walletNumberMasked: '',
      msisdn: '',
    });

  const submitNewPaymentMethod = async () => {
    try {
      let payload = { type: newPm.type, label: newPm.label, isDefault: newPm.isDefault };

      if (newPm.type === 'card') {
        payload = {
          ...payload,
          brand: newPm.brand || 'Card',
          last4: (newPm.last4 || '').slice(-4),
          expMonth: Number(newPm.expMonth) || undefined,
          expYear: Number(newPm.expYear) || undefined,
        };
      } else {
        payload = {
          ...payload,
          walletNumberMasked: newPm.walletNumberMasked || '',
          msisdn: newPm.msisdn || '',
        };
      }

      await addPaymentMethod(payload);
      resetNewPm();
      setSuccessMessage('Payment method added successfully!');
    } catch (e) {
      console.error('Add payment method failed', e);
      const errorMessage = e?.response?.data?.message || 'Failed to add payment method';
      setErrors({ paymentMethod: errorMessage });
    }
  };

  const maskMsisdn = (msisdn) => {
    if (!msisdn) return '';
    return msisdn.replace(/^(\d{2})\d+(\d{2})$/, '$1********$2');
  };

  const renderPmBadge = (pm) => {
    const type = pm.type;
    if (type === 'card') {
      const label = pm.label || `${pm.brand || 'Card'} **** ${pm.last4 || 'XXXX'}`;
      const exp =
        pm.expMonth && pm.expYear ? ` (exp ${String(pm.expMonth).padStart(2, '0')}/${pm.expYear})` : '';
      return `${label}${exp}`;
    }
    const label = pm.label || `${type.toUpperCase()} ${pm.walletNumberMasked || maskMsisdn(pm.msisdn) || ''}`;
    return label;
  };

  // ---------- Edit existing payment method ----------
  const startEditingMethod = (pm) => {
    setEditingPmId(pm._id);
    if (pm.type === 'card') {
      setEditFields({
        label: pm.label || '',
        brand: pm.brand || '',
        last4: pm.last4 || '',
        expMonth: pm.expMonth || '',
        expYear: pm.expYear || '',
      });
    } else {
      setEditFields({
        label: pm.label || '',
        walletNumberMasked: pm.walletNumberMasked || '',
        msisdn: pm.msisdn || '',
      });
    }
  };

  const cancelEditMethod = () => {
    setEditingPmId(null);
    setEditFields({});
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditFields((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditedPaymentMethod = async () => {
    try {
      const payload =
        paymentMethods.find((p) => p._id === editingPmId)?.type === 'card'
          ? {
              ...editFields,
              expMonth:
                editFields.expMonth !== '' && !Number.isNaN(Number(editFields.expMonth))
                  ? Number(editFields.expMonth)
                  : undefined,
              expYear:
                editFields.expYear !== '' && !Number.isNaN(Number(editFields.expYear))
                  ? Number(editFields.expYear)
                  : undefined,
              last4: String(editFields.last4 || '').slice(-4),
            }
          : { ...editFields };

      await editPaymentMethod(editingPmId, payload);
      cancelEditMethod();
      setSuccessMessage('Payment method updated successfully!');
    } catch (e) {
      console.error('Update payment method failed', e);
      const errorMessage = e?.response?.data?.message || 'Failed to update payment method';
      setErrors({ paymentMethod: errorMessage });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <FaUser className="text-white text-xl" />
          </div>
          My Profile
        </h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <FaCheck className="text-green-600 text-lg" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <FaUser className="text-yellow-600" />
              Personal Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">Update your personal details</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { field: 'firstName', icon: <FaUser className="text-yellow-500" /> },
                { field: 'lastName', icon: <FaUser className="text-yellow-500" /> },
                { field: 'fullName', icon: <FaIdCard className="text-yellow-500" /> },
                { field: 'phoneNumber', icon: <FaPhone className="text-yellow-500" /> },
                { field: 'userName', icon: <FaUser className="text-yellow-500" /> },
              ].map(({ field, icon }) => renderField(field, field, formData[field], icon))}
              
              {/* Email field without edit functionality */}
              <div className="w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaEnvelope className="text-yellow-500" />
                  Email
                </label>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <span className="text-gray-800 truncate">{formData.email || 'Not provided'}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Read Only</span>
                </div>
              </div>
            </div>
            
            {/* Security Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaLock className="text-yellow-600" />
                Security Settings
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <FaKey />
                  Change Password
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <FaEnvelope />
                  Update Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <FaMapMarkerAlt className="text-yellow-600" />
              Address Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage your shipping address</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['street', 'city', 'state', 'zipCode', 'country'].map((field) =>
                renderField(
                  `address.${field}`,
                  field,
                  formData.address?.[field],
                  <FaMapMarkerAlt className="text-yellow-500" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <FaCreditCard className="text-yellow-600" />
              Payment Methods
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage your payment options</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Method Error Display */}
            {errors.paymentMethod && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <FaExclamationTriangle className="text-red-600 text-lg" />
                <span className="text-red-800">{errors.paymentMethod}</span>
              </div>
            )}

            {/* Existing methods */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Payment Methods</h3>
              <div className="space-y-4">
                {(paymentMethods || []).length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FaCreditCard className="text-gray-400 text-4xl mx-auto mb-3" />
                    <p className="text-gray-600">No payment methods saved yet.</p>
                    <p className="text-sm text-gray-500">Add a payment method to get started.</p>
                  </div>
                ) : (
                  paymentMethods.map((pm) => {
                    const isDefault = pm._id === defaultPaymentMethod?._id || pm.isDefault;
                    const isEditingPm = pm._id === editingPmId;

                    return (
                      <div
                        key={pm._id}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                      >
                        {!isEditingPm ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <FaCreditCard className="text-white text-lg" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{renderPmBadge(pm)}</div>
                                <div className="text-sm text-gray-600 capitalize">Type: {pm.type}</div>
                                {isDefault && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <FaStar className="text-yellow-500 text-xs" />
                                    <span className="text-xs text-yellow-600 font-medium">Default</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDefault && (
                                <button
                                  className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                                  title="Make default"
                                  onClick={() => makeDefaultPaymentMethod(pm._id)}
                                >
                                  <FaRegStar />
                                </button>
                              )}

                              <button
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit"
                                onClick={() => startEditingMethod(pm)}
                              >
                                <FaEdit />
                              </button>

                              <button
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Remove"
                                onClick={() => removePaymentMethod(pm._id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                                <input
                                  name="label"
                                  value={editFields.label || ''}
                                  onChange={handleEditFieldChange}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  placeholder="e.g., Personal bKash, Visa **** 4242"
                                />
                              </div>

                              {pm.type === 'card' ? (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                                    <input
                                      name="brand"
                                      value={editFields.brand || ''}
                                      onChange={handleEditFieldChange}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="Visa, MasterCard"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last 4</label>
                                    <input
                                      name="last4"
                                      value={editFields.last4 || ''}
                                      onChange={handleEditFieldChange}
                                      maxLength={4}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="1234"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Month</label>
                                    <input
                                      name="expMonth"
                                      type="number"
                                      min={1}
                                      max={12}
                                      value={editFields.expMonth || ''}
                                      onChange={handleEditFieldChange}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="MM"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Year</label>
                                    <input
                                      name="expYear"
                                      type="number"
                                      min={new Date().getFullYear()}
                                      value={editFields.expYear || ''}
                                      onChange={handleEditFieldChange}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="YYYY"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet (masked)</label>
                                    <input
                                      name="walletNumberMasked"
                                      value={editFields.walletNumberMasked || ''}
                                      onChange={handleEditFieldChange}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="01*********89"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">MSISDN (optional)</label>
                                    <input
                                      name="msisdn"
                                      value={editFields.msisdn || ''}
                                      onChange={handleEditFieldChange}
                                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                      placeholder="01XXXXXXXXX"
                                    />
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={saveEditedPaymentMethod}
                                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
                              >
                                <FaCheck />
                                Save
                              </button>
                              <button
                                onClick={cancelEditMethod}
                                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add new method */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaPlus className="text-yellow-600" />
                Add New Payment Method
              </h3>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      name="type"
                      value={newPm.type}
                      onChange={handleNewPmChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Label (optional)</label>
                    <input
                      name="label"
                      value={newPm.label}
                      onChange={handleNewPmChange}
                      placeholder="e.g., Personal bKash, Visa **** 4242"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="isDefault"
                      type="checkbox"
                      name="isDefault"
                      checked={newPm.isDefault}
                      onChange={handleNewPmChange}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">
                      Set as default
                    </label>
                  </div>

                  {newPm.type === 'card' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input
                          name="brand"
                          value={newPm.brand}
                          onChange={handleNewPmChange}
                          placeholder="Visa, MasterCard"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last 4</label>
                        <input
                          name="last4"
                          value={newPm.last4}
                          onChange={handleNewPmChange}
                          placeholder="1234"
                          maxLength={4}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Month</label>
                        <input
                          name="expMonth"
                          type="number"
                          min={1}
                          max={12}
                          value={newPm.expMonth}
                          onChange={handleNewPmChange}
                          placeholder="MM"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Year</label>
                        <input
                          name="expYear"
                          type="number"
                          min={new Date().getFullYear()}
                          value={newPm.expYear}
                          onChange={handleNewPmChange}
                          placeholder="YYYY"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wallet number (masked)</label>
                        <input
                          name="walletNumberMasked"
                          value={newPm.walletNumberMasked}
                          onChange={handleNewPmChange}
                          placeholder="01*********89"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">MSISDN (optional)</label>
                        <input
                          name="msisdn"
                          value={newPm.msisdn}
                          onChange={handleNewPmChange}
                          placeholder="01XXXXXXXXX"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={submitNewPaymentMethod}
                    className="px-6 py-3 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <FaPlus />
                    Add Method
                  </button>
                  <button
                    onClick={resetNewPm}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Security Notice</p>
                      <p>For cards, we only store brand, last 4 digits, and expiry date. We never collect or store full card numbers or CVV on our servers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaKey className="text-yellow-600" />
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaKey className="text-yellow-600 text-2xl" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Update Your Password</h4>
                <p className="text-gray-600 text-sm">Enter your current password and choose a new secure password</p>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      Contains lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      Contains uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      Contains number
                    </li>
                  </ul>
                </div>

                {errors.password && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.password}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updatePassword}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setErrors({});
                    }}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Update Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaEnvelope className="text-blue-600" />
                  Update Email Address
                </h3>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ newEmail: '', otp: '' });
                    setOtpSent(false);
                    setOtpTimer(0);
                    setVerificationStep('email');
                    setErrors({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    verificationStep === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-12 h-0.5 mx-2 ${
                    verificationStep === 'otp' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    verificationStep === 'otp' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {verificationStep === 'email' ? (
                  <>
                    {/* Step 1: Enter New Email */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaEnvelope className="text-blue-600 text-2xl" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Enter New Email</h4>
                      <p className="text-gray-600 text-sm">We'll send a verification code to your new email address</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        name="newEmail"
                        value={emailData.newEmail}
                        onChange={handleEmailChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new email address"
                      />
                      {errors.newEmail && (
                        <p className="text-red-600 text-sm mt-1">{errors.newEmail}</p>
                      )}
                    </div>

                    {errors.email && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{errors.email}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={sendEmailOTP}
                        disabled={loading || !emailData.newEmail}
                        className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                      </button>
                      <button
                        onClick={() => {
                          setShowEmailModal(false);
                          setEmailData({ newEmail: '', otp: '' });
                          setOtpSent(false);
                          setOtpTimer(0);
                          setVerificationStep('email');
                          setErrors({});
                        }}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: Verify OTP */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheck className="text-green-600 text-2xl" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h4>
                      <p className="text-gray-600 text-sm">
                        We've sent a 6-digit verification code to <br />
                        <span className="font-medium text-gray-900">{emailData.newEmail}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        name="otp"
                        value={emailData.otp}
                        onChange={handleEmailChange}
                        maxLength={6}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="000000"
                        autoFocus
                      />
                      {errors.otp && (
                        <p className="text-red-600 text-sm mt-1">{errors.otp}</p>
                      )}
                    </div>

                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-sm text-gray-600">
                          Resend code in <span className="font-medium">{otpTimer}</span> seconds
                        </p>
                      ) : (
                        <button
                          onClick={sendEmailOTP}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Didn't receive the code? Resend
                        </button>
                      )}
                    </div>

                    {errors.email && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{errors.email}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={updateEmail}
                        disabled={loading || !emailData.otp || emailData.otp.length !== 6}
                        className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Verifying...' : 'Verify & Update Email'}
                      </button>
                      <button
                        onClick={() => {
                          setVerificationStep('email');
                          setEmailData(prev => ({ ...prev, otp: '' }));
                          setOtpSent(false);
                          setOtpTimer(0);
                          setErrors({});
                        }}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;