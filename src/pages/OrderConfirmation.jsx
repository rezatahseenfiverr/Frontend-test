import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBoxOpen, FaCreditCard, FaTruck, FaUser, FaHome, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await axios.get(`http://localhost:3000/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order. Please try again.');
        console.error('Order fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <div className="text-red-500 text-2xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  if (!order) return null;

  // Format date for estimated delivery (3 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Order Confirmation Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Your order <span className="font-semibold">#{order.orderId}</span> has been placed successfully.
          </p>
          <p className="text-gray-500 mt-2">We've sent a confirmation to your email.</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          {/* Order Summary */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FaBoxOpen className="mr-2 text-blue-500" />
              Order Summary
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <ul className="divide-y divide-gray-200">
              {order.items.map((item, idx) => (
                <li key={idx} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <img 
                      src={item.mainImage} 
                      alt={item.name} 
                      className="flex-shrink-0 h-16 w-16 rounded-md object-cover border border-gray-200"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                        <p className="ml-4 text-sm font-semibold text-gray-900">BDT{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {item.size && <span className="mr-3">Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Qty: {item.quantity} × BDT{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Payment Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FaCreditCard className="mr-2 text-blue-500" />
                Payment Information
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {order.paymentMethod.toLowerCase()}
                    {order.paymentDetails?.trxId && (
                      <div className="mt-1 text-sm text-gray-500">
                        Transaction ID: {order.paymentDetails.trxId}
                      </div>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </dd>
                </div>
                {order.couponCode && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Coupon Applied</dt>
                    <dd className="mt-1 text-sm text-green-600 font-medium">{order.couponCode}</dd>
                  </div>
                )}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">BDT{order.totalAmount.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FaTruck className="mr-2 text-blue-500" />
                Shipping Information
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <FaUser className="mr-2" />
                  Recipient
                </h4>
                <p className="mt-1 text-sm text-gray-900">{order.shippingAddress.fullName}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <FaHome className="mr-2" />
                  Address
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {order.shippingAddress.address}, {order.shippingAddress.city}<br />
                  {order.shippingAddress.state}, {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <FaPhone className="mr-2" />
                  Contact
                </h4>
                <p className="mt-1 text-sm text-gray-900">{order.shippingAddress.phone}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 flex items-center">
                  <FiClock className="mr-2" />
                  Estimated Delivery
                </h4>
                <p className="mt-1 text-sm text-gray-900">{formattedDeliveryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-blue-500" />
              Order Status
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                order.orderStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.orderStatus === 'pending' && '1'}
                {order.orderStatus === 'processing' && '2'}
                {order.orderStatus === 'shipped' && '3'}
                {order.orderStatus === 'delivered' && '4'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {order.orderStatus}
                  <span className="ml-2 text-xs text-gray-500">
                    {order.orderStatus === 'pending' && 'Your order is being processed'}
                    {order.orderStatus === 'processing' && 'We are preparing your order'}
                    {order.orderStatus === 'shipped' && 'Your order is on the way'}
                    {order.orderStatus === 'delivered' && 'Your order has been delivered'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate('/profile/orders')}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View All Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
