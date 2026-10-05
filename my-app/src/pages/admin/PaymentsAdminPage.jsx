import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Selected Payment Detail Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;

      const res = await axios.get('http://localhost:5000/api/admin/payments', { headers, params }).catch(() => ({ data: { payments: [] } }));
      setPayments(res.data?.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (payment) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`http://localhost:5000/api/payments/${payment.id}`, { headers });
      setSelectedPayment(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setSelectedPayment(payment);
      setIsDetailModalOpen(true);
    }
  };

  const handleOpenRefundModal = (payment) => {
    setSelectedPayment(payment);
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // POST /api/payments/refund
      await axios.post('http://localhost:5000/api/payments/refund', {
        payment_id: selectedPayment.id,
        reason: refundReason
      }, { headers });

      setSuccessMsg('Refund processed successfully.');
      setIsRefundModalOpen(false);
      fetchPayments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(err.response?.data?.error || 'Failed to process refund.');
    }
  };

  // Calculate Statistics
  const totalRevenue = payments.filter(p => p.status === 'success' || p.status === 'paid').reduce((acc, p) => acc + (Number(p.final_amount || p.amount) || 0), 0);
  const successfulCount = payments.filter(p => p.status === 'success' || p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const refundCount = payments.filter(p => p.status === 'refunded').length;

  const filteredPayments = payments.filter(p => {
    const student = p.student_name || p.user_name || '';
    const course = p.course_title || '';
    const txId = p.transaction_id || String(p.id || '');
    const query = searchQuery.toLowerCase();
    return student.toLowerCase().includes(query) || course.toLowerCase().includes(query) || txId.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6 space-y-6">
          <div>
            <Link to="/" className="text-xl font-extrabold tracking-wider text-indigo-500">
              CODE RUNNER
            </Link>
            <span className="block text-[10px] text-gray-500 uppercase tracking-widest mt-1">Admin Command Center</span>
          </div>

          <nav className="space-y-1 text-xs">
            {[
              { label: '📊 Dashboard', path: '/admin' },
              { label: '👥 User Management', path: '/admin/users' },
              { label: '💻 Course Management', path: '/admin/courses' },
              { label: '📂 Category Management', path: '/admin/categories' },
              { label: '🗺️ Roadmap Management', path: '/admin/roadmaps' },
              { label: '🎓 Enrollment Management', path: '/admin/enrollments' },
              { label: '💳 Payment Management', path: '/admin/payments', active: true },
              { label: '🏆 Certificate Management', path: '/admin/certificates' },
              { label: '📈 Reports & Analytics', path: '/admin/reports' },
            ].map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`block px-4 py-2.5 rounded-xl font-semibold transition ${
                  item.active ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-900 text-center">
          <Link to="/dashboard" className="text-xs text-indigo-400 hover:underline">← Exit to Student View</Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-white">Payment Management</h1>
            <p className="text-xs text-gray-400">Monitor platform transactions, revenue, and process refunds.</p>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Payment Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Revenue</span>
              <div className="text-xl font-extrabold text-emerald-400">${totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Successful Payments</span>
              <div className="text-xl font-extrabold text-white">{successfulCount}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pending Payments</span>
              <div className="text-xl font-extrabold text-amber-400">{pendingCount}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Refunds</span>
              <div className="text-xl font-extrabold text-purple-400">{refundCount}</div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search by student, course, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex space-x-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="success">Success / Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Methods</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="razorpay">Razorpay</option>
              </select>
            </div>
          </div>

          {/* Payment Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-700 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Final Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan="10" className="p-8 text-center text-gray-400">Loading payments...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan="10" className="p-8 text-center text-gray-400">No payment records found.</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-750 transition">
                      <td className="p-4 font-mono text-[10px] text-gray-300">{p.transaction_id || `TXN-${p.id}`}</td>
                      <td className="p-4 font-bold text-white">{p.student_name || p.user_name || 'Student'}</td>
                      <td className="p-4 text-indigo-400 font-semibold">{p.course_title || 'Course'}</td>
                      <td className="p-4 text-gray-300">${p.amount || '0.00'}</td>
                      <td className="p-4 text-gray-400">${p.discount || '0.00'}</td>
                      <td className="p-4 font-bold text-emerald-400">${p.final_amount || p.amount || '0.00'}</td>
                      <td className="p-4 uppercase text-[10px] text-gray-300">{p.payment_method || 'Stripe'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          p.status === 'success' || p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          p.status === 'refunded' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.status || 'Success'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetails(p)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          View
                        </button>
                        {p.status !== 'refunded' && (
                          <button
                            onClick={() => handleOpenRefundModal(p)}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-bold"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* View Payment Modal */}
      {isDetailModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Payment Receipt Details</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <div><span className="text-gray-400">Transaction ID:</span> <strong className="text-white ml-2 font-mono">{selectedPayment.transaction_id || `TXN-${selectedPayment.id}`}</strong></div>
              <div><span className="text-gray-400">Student:</span> <strong className="text-white ml-2">{selectedPayment.student_name || selectedPayment.user_name}</strong></div>
              <div><span className="text-gray-400">Course:</span> <strong className="text-white ml-2">{selectedPayment.course_title}</strong></div>
              <div><span className="text-gray-400">Original Amount:</span> <strong className="text-white ml-2">${selectedPayment.amount}</strong></div>
              <div><span className="text-gray-400">Discount:</span> <strong className="text-white ml-2">${selectedPayment.discount || '0.00'}</strong></div>
              <div><span className="text-gray-400">Final Amount Paid:</span> <strong className="text-emerald-400 ml-2">${selectedPayment.final_amount || selectedPayment.amount}</strong></div>
              <div><span className="text-gray-400">Payment Method:</span> <strong className="text-white ml-2 uppercase">{selectedPayment.payment_method || 'Stripe'}</strong></div>
              <div><span className="text-gray-400">Status:</span> <strong className="text-white ml-2 uppercase">{selectedPayment.status}</strong></div>
              <div><span className="text-gray-400">Date:</span> <strong className="text-white ml-2">{selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString() : 'N/A'}</strong></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Process Refund</h3>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleProcessRefund} className="space-y-4">
              <p className="text-gray-300">Are you sure you want to refund <strong className="text-emerald-400">${selectedPayment.final_amount || selectedPayment.amount}</strong> for transaction <span className="font-mono text-indigo-400">{selectedPayment.transaction_id || `TXN-${selectedPayment.id}`}</span>?</p>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Reason for Refund</label>
                <textarea
                  rows="3"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g., Student requested cancellation within policy timeframe..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}