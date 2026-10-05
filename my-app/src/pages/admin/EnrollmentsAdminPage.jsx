import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function EnrollmentsAdminPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Detail Modal State
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Status Change State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('active');

  useEffect(() => {
    fetchData();
  }, [courseFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {};
      if (courseFilter) params.course_id = courseFilter;
      if (statusFilter) params.status = statusFilter;

      const [enrollRes, courseRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/enrollments', { headers, params }).catch(() => ({ data: { enrollments: [] } })),
        axios.get('http://localhost:5000/api/courses', { headers }).catch(() => ({ data: { courses: [] } }))
      ]);

      setEnrollments(enrollRes.data?.enrollments || []);
      setCourses(courseRes.data?.courses || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load enrollment records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setNewStatus(enrollment.status || 'active');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.patch(`http://localhost:5000/api/enrollments/${selectedEnrollment.id}/status`, { status: newStatus }, { headers });
      setSuccessMsg('Enrollment status updated successfully.');
      setIsStatusModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating enrollment status:', err);
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleOpenDetails = async (enrollment) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`http://localhost:5000/api/enrollments/${enrollment.id}`, { headers });
      setSelectedEnrollment(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error fetching enrollment details:', err);
      setSelectedEnrollment(enrollment);
      setIsDetailModalOpen(true);
    }
  };

  const filteredEnrollments = enrollments.filter(item => {
    const studentName = item.student_name || item.user_name || '';
    const courseTitle = item.course_title || '';
    const query = searchQuery.toLowerCase();
    return studentName.toLowerCase().includes(query) || courseTitle.toLowerCase().includes(query);
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
              { label: '🎓 Enrollment Management', path: '/admin/enrollments', active: true },
              { label: '💳 Payment Management', path: '/admin/payments' },
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
            <h1 className="text-lg font-bold text-white">Enrollment Management</h1>
            <p className="text-xs text-gray-400">Track student course enrollments, status, and progress.</p>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Filters & Search Toolbar */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search by student name or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex space-x-3 w-full md:w-auto">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Enrollment Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-700 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Student</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Enrollment Date</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Enrollment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading enrollments...</td></tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No enrollments found.</td></tr>
                ) : (
                  filteredEnrollments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-750 transition">
                      <td className="p-4 font-bold text-white">{item.student_name || item.user_name || 'Student'}</td>
                      <td className="p-4 text-indigo-400 font-semibold">{item.course_title || 'Course'}</td>
                      <td className="p-4 text-gray-400">{item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          item.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.payment_status || 'Paid'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-700">
                            <div className="bg-indigo-500 h-full" style={{ width: `${item.progress_percentage || 0}%` }}></div>
                          </div>
                          <span className="text-[10px] text-gray-400">{item.progress_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          item.status === 'completed' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          item.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetails(item)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(item)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold"
                        >
                          Change Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* View Enrollment Modal */}
      {isDetailModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Enrollment Details</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <div><span className="text-gray-400">Student Name:</span> <strong className="text-white ml-2">{selectedEnrollment.student_name || selectedEnrollment.user_name}</strong></div>
              <div><span className="text-gray-400">Course Title:</span> <strong className="text-white ml-2">{selectedEnrollment.course_title}</strong></div>
              <div><span className="text-gray-400">Enrollment Date:</span> <strong className="text-white ml-2">{selectedEnrollment.enrolled_at ? new Date(selectedEnrollment.enrolled_at).toLocaleString() : 'N/A'}</strong></div>
              <div><span className="text-gray-400">Status:</span> <strong className="text-white ml-2 uppercase">{selectedEnrollment.status}</strong></div>
              <div><span className="text-gray-400">Payment Status:</span> <strong className="text-white ml-2 uppercase">{selectedEnrollment.payment_status || 'Paid'}</strong></div>
              <div><span className="text-gray-400">Progress:</span> <strong className="text-white ml-2">{selectedEnrollment.progress_percentage || 0}%</strong></div>
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

      {/* Change Status Modal */}
      {isStatusModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Change Enrollment Status</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}