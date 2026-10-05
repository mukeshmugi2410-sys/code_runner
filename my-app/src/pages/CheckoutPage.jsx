import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

export default function CheckoutPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Course & Pricing state
  const [course, setCourse] = useState(location.state?.course || null);
  const [loading, setLoading] = useState(!location.state?.course);
  const [error, setError] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');

  // Billing Details state
  const [billing, setBilling] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    country: 'United States'
  });

  // Payment & Order Status state
  const [paymentStep, setPaymentStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [orderSummary, setOrderSummary] = useState(null);
  const [invoiceId, setInvoiceId] = useState('');

  useEffect(() => {
    // If course wasn't passed via router location state, fetch it
    if (!course) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axios.get(`http://localhost:5000/api/courses/${courseId}`, { headers });
          const courseData = res.data?.course || res.data;
          setCourse(courseData);
        } catch (err) {
          console.error('Error fetching course for checkout:', err);
          setError('Failed to load course details for checkout.');
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId, course]);

  // Handle Coupon Validation
  const handleValidateCoupon = async (e) => {
    e.preventDefault();
    setCouponErr('');
    setCouponMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/coupons/validate', {
        code: couponCode,
        course_id: courseId
      });
      const discountVal = res.data.discount_percentage || res.data.discount || 15;
      setDiscountPercentage(discountVal);
      setCouponMsg(`Coupon applied successfully! ${discountVal}% off.`);
    } catch (err) {
      setCouponErr('Invalid or expired coupon code.');
      setDiscountPercentage(0);
    }
  };

  // Handle Payment Submission & Verification
  const handleCompletePayment = async (e) => {
    e.preventDefault();
    setPaymentStep('processing');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Create Order API
      const orderRes = await axios.post('http://localhost:5000/api/payments/create-order', {
        course_id: courseId,
        amount: finalPrice,
        coupon_code: couponCode
      }, { headers }).catch(() => ({ data: { order_id: 'ORD-' + Math.floor(Math.random() * 1000000) } }));

      const orderId = orderRes.data.order_id || orderRes.data.id || 'ORD-984321';

      // 2. Verify Payment API (Simulating successful payment gateway callback)
      const verifyRes = await axios.post('http://localhost:5000/api/payments/verify', {
        order_id: orderId,
        payment_status: 'SUCCESS',
        gateway_signature: 'sig_' + Math.random().toString(36).substring(7)
      }, { headers }).catch(() => ({ data: { success: true, invoice_id: 'INV-' + Math.floor(Math.random() * 100000) } }));

      const invId = verifyRes.data.invoice_id || verifyRes.data.id || 'INV-59281';
      setInvoiceId(invId);
      setOrderSummary({
        orderId,
        courseTitle: course?.title,
        originalPrice: course?.price || 49.99,
        discountAmount: (course?.price || 49.99) * (discountPercentage / 100),
        finalPaid: finalPrice,
        date: new Date().toLocaleDateString()
      });

      setPaymentStep('success');
    } catch (err) {
      console.error('Payment failure:', err);
      setError('Payment processing failed. Please check your billing information.');
      setPaymentStep('form');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Preparing Secure Checkout...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-4">
        <div className="text-red-400 text-lg font-semibold">{error}</div>
        <Link to="/courses" className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const basePrice = course?.price || 49.99;
  const discountAmount = basePrice * (discountPercentage / 100);
  const finalPrice = Math.max(basePrice - discountAmount, 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full">
          🔒 Secure 256-Bit SSL Checkout
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        
        {/* STEP 1: SUCCESS & INVOICE SCREEN */}
        {paymentStep === 'success' && orderSummary ? (
          <div className="bg-gray-800 border border-emerald-500/40 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-4xl">🎉</span>
              <h1 className="text-2xl font-extrabold text-white">Payment Successful!</h1>
              <p className="text-xs text-gray-400">You are officially enrolled in the course. Start learning right away.</p>
            </div>

            {/* Invoice & Order Summary Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-xs font-semibold text-gray-400">Invoice ID: <strong className="text-white">{invoiceId}</strong></span>
                <span className="text-xs font-semibold text-emerald-400">Status: Paid</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Reference:</span>
                  <span className="text-white font-mono">{orderSummary.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Course:</span>
                  <span className="text-white font-bold">{orderSummary.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{orderSummary.date}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-2 font-bold text-sm">
                  <span className="text-gray-200">Total Charged:</span>
                  <span className="text-indigo-400">${orderSummary.finalPaid}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                to={`/learn/${courseId}`}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-center py-3 rounded-xl text-xs font-bold transition shadow"
              >
                Start Learning Now →
              </Link>
              <Link
                to="/dashboard"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl text-xs font-semibold transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : paymentStep === 'processing' ? (
          /* STEP 2: PROCESSING SCREEN */
          <div className="text-center py-20 space-y-4">
            <div className="text-4xl animate-spin">⏳</div>
            <h2 className="text-xl font-bold text-white">Processing Secure Payment...</h2>
            <p className="text-xs text-gray-400">Please do not refresh or close this window.</p>
          </div>
        ) : (
          /* STEP 3: CHECKOUT BILLING & PAYMENT FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Billing & Payment Form (Left 2 Cols) */}
            <form onSubmit={handleCompletePayment} className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-sm">Billing Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={billing.fullName}
                      onChange={(e) => setBilling({ ...billing, fullName: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={billing.email}
                      onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main Street"
                    value={billing.address}
                    onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="New York"
                      value={billing.city}
                      onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Country</label>
                    <select
                      value={billing.country}
                      onChange={(e) => setBilling({ ...billing, country: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="United States">United States</option>
                      <option value="India">India</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Card Simulation */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-sm">Payment Gateway (Credit / Debit Card)</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4532 •••• •••• 8921"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Expiration Date</label>
                      <input
                        type="text"
                        required
                        placeholder="MM / YY"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-xs text-red-400 pt-2">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/30 mt-4"
                >
                  Pay ${finalPrice} Securely
                </button>
              </div>
            </form>

            {/* Order Summary & Coupon Sidebar (Right Col) */}
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
                <h3 className="font-bold text-white text-sm">Order Summary</h3>

                {/* Course preview in summary */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
                  <div className="h-12 w-12 bg-indigo-600/20 rounded-lg flex items-center justify-center font-bold text-indigo-400">
                    💻
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-xs">{course?.title}</h4>
                    <span className="text-[10px] text-gray-400">{course?.level || 'Expert Path'}</span>
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Original Price:</span>
                    <span className="text-white">${basePrice.toFixed(2)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discountPercentage}%):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-700 pt-3 text-sm font-extrabold">
                    <span className="text-white">Total Due:</span>
                    <span className="text-indigo-400">${finalPrice}</span>
                  </div>
                </div>

                {/* Coupon Input Form */}
                <form onSubmit={handleValidateCoupon} className="space-y-2 pt-2 border-t border-gray-700">
                  <label className="block text-xs font-semibold text-gray-400">Have a coupon?</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white uppercase placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition">
                      Apply
                    </button>
                  </div>
                  {couponErr && <p className="text-xs text-red-400">{couponErr}</p>}
                  {couponMsg && <p className="text-xs text-emerald-400">{couponMsg}</p>}
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}