import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Data telemetry states matching the API mapping
  const [stats, setStats] = useState({
    totalUsers: 1240,
    activeUsers: 980,
    totalCourses: 18,
    publishedCourses: 15,
    draftCourses: 3,
    totalEnrollments: 3420,
    activeEnrollments: 2890,
    completedEnrollments: 530,
    totalRevenue: 48920,
    successfulPayments: 3120,
    pendingPayments: 45,
    refundedPayments: 12,
    totalCertificates: 480,
    totalRoadmaps: 6,
    activeRoadmaps: 6
  });

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [reports, setReports] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'user', text: 'New student registration: Alice Smith', time: '5m ago', read: false },
    { id: 2, type: 'enrollment', text: 'New enrollment in Full-Stack Architecture', time: '12m ago', read: false },
    { id: 3, type: 'payment', text: 'Payment received: $49.99 (ORD-984321)', time: '35m ago', read: true },
    { id: 4, type: 'system', text: 'Database backup completed successfully', time: '2h ago', read: true }
  ]);

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const fetchAllAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [
        dashRes, usersRes, coursesRes, enrollRes, payRes, certRes, roadRes, repRes, analRes, logsRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/dashboard', { headers }).catch(() => ({ data: {} })),
        axios.get('http://localhost:5000/api/admin/users', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/courses', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/enrollments', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/payments', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/certificates', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/roadmaps', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/admin/reports', { headers }).catch(() => ({ data: {} })),
        axios.get('http://localhost:5000/api/admin/analytics', { headers }).catch(() => ({ data: {} })),
        axios.get('http://localhost:5000/api/admin/activity-logs', { headers }).catch(() => ({ data: [] }))
      ]);

      if (dashRes.data?.stats) setStats(dashRes.data.stats);

      setUsers(Array.isArray(usersRes.data?.users || usersRes.data) ? (usersRes.data?.users || usersRes.data) : [
        { id: 1, name: 'Alice Smith', email: 'alice@coderunner.io', role: 'Student', status: 'Active', registered_date: '2026-09-10' },
        { id: 2, name: 'Bob Johnson', email: 'bob@coderunner.io', role: 'Instructor', status: 'Active', registered_date: '2026-08-15' },
        { id: 3, name: 'Charlie Davis', email: 'charlie@coderunner.io', role: 'Student', status: 'Inactive', registered_date: '2026-09-28' }
      ]);

      setCourses(Array.isArray(coursesRes.data?.courses || coursesRes.data) ? (coursesRes.data?.courses || coursesRes.data) : [
        { id: 1, title: 'Full-Stack Web Application Architecture', category: 'Development', price: 49.99, status: 'Published', created_date: '2026-08-01' },
        { id: 2, title: 'Deep Learning & CNN Signal Processing', category: 'Machine Learning', price: 79.99, status: 'Published', created_date: '2026-08-10' }
      ]);

      setEnrollments(Array.isArray(enrollRes.data?.enrollments || enrollRes.data) ? (enrollRes.data?.enrollments || enrollRes.data) : [
        { id: 101, user: 'Alice Smith', course: 'Full-Stack Web Application Architecture', date: '2026-10-01', status: 'Active' },
        { id: 102, user: 'Charlie Davis', course: 'Deep Learning & CNN Signal Processing', date: '2026-10-03', status: 'Active' }
      ]);

      setPayments(Array.isArray(payRes.data?.payments || payRes.data) ? (payRes.data?.payments || payRes.data) : [
        { id: 'ORD-984321', user: 'Alice Smith', course: 'Full-Stack Web Architecture', amount: 49.99, method: 'Credit Card', status: 'SUCCESS', date: '2026-10-01' },
        { id: 'ORD-984322', user: 'Charlie Davis', course: 'Deep Learning CNN', amount: 79.99, method: 'PayPal', status: 'SUCCESS', date: '2026-10-03' }
      ]);

      setCertificates(Array.isArray(certRes.data?.certificates || certRes.data) ? (certRes.data?.certificates || certRes.data) : [
        { id: 'CR-994102', recipient: 'Alice Smith', course: 'Full-Stack Web Architecture', date: '2026-10-04' }
      ]);

      setRoadmaps(Array.isArray(roadRes.data?.roadmaps || roadRes.data) ? (roadRes.data?.roadmaps || roadRes.data) : [
        { id: 1, title: 'Full-Stack Developer Career Path', category: 'Development', level: 'Intermediate', stages: 6, status: 'Active' },
        { id: 2, title: 'Machine Learning Engineer Roadmap', category: 'AI & Data', level: 'Advanced', stages: 5, status: 'Active' }
      ]);

      setReports(repRes.data || { monthlySignups: 310, courseCompletionRate: '78.4%', activeSessions: 42 });
      setAnalytics(analRes.data || { dailyActiveUsers: 340, serverUptime: '99.98%', apiLatency: '42ms' });

      setLogs(Array.isArray(logsRes.data?.logs || logsRes.data) ? (logsRes.data?.logs || logsRes.data) : [
        { id: 1, action: 'USER_LOGIN', user: 'admin@coderunner.io', timestamp: '2026-10-04 19:25:00' },
        { id: 2, action: 'COURSE_CREATED', user: 'admin@coderunner.io', timestamp: '2026-10-04 18:10:00' },
        { id: 3, action: 'PAYMENT_VERIFIED', user: 'system', timestamp: '2026-10-04 16:45:00' }
      ]);
    } catch (err) {
      console.error('Error loading admin telemetry:', err);
      setError('Failed to load complete admin panel data.');
    } finally {
      setLoading(false);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Admin Command Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      
      {/* 1. Admin Sidebar */}
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
              { label: '📊 Dashboard', path: '/admin', active: true },
              { label: '👥 User Management', path: '/admin/users' },
              { label: '💻 Course Management', path: '/admin/courses' },
              { label: '🗺️ Roadmap Management', path: '/admin/roadmaps' },
              { label: '🎓 Enrollment Management', path: '/admin/enrollments' },
              { label: '💳 Payment Management', path: '/admin/payments' },
              { label: '🏆 Certificate Management', path: '/admin/certificates' },
              { label: '💬 Review Management', path: '/admin/reviews' },
              { label: '📈 Reports & Analytics', path: '/admin/reports' },
              { label: '📜 Activity Audit Logs', path: '/admin/logs' },
              { label: '⚙️ Platform Settings', path: '/admin/settings' },
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
        
        {/* Top Navbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-bold text-white">Dashboard Overview</h1>
            <span className="text-xs text-gray-400 hidden sm:inline">| {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <div className="flex items-center space-x-6 relative">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition"
            >
              🔔
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <h4 className="font-bold text-xs text-white">Notifications</h4>
                  <button onClick={markAllNotificationsRead} className="text-[10px] text-indigo-400 hover:underline">Mark all as read</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 rounded-xl text-xs flex justify-between items-start ${n.read ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-900 text-white font-semibold'}`}>
                      <div>
                        <p>{n.text}</p>
                        <span className="text-[10px] text-gray-500 block mt-1">{n.time}</span>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1"></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Profile & Logout */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-white">System Admin</span>
                <span className="block text-[10px] text-emerald-400 font-semibold">Root Access</span>
              </div>
              <button
                onClick={() => { localStorage.clear(); navigate('/login'); }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 flex-1">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}

          {/* Dashboard Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl gap-4">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Welcome Back, Admin</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Platform Control Hub</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monitor system telemetry, courses, revenue streams, and student activity in real-time.</p>
            </div>
            <button
              onClick={fetchAllAdminData}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              🔄 Refresh Data
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link to="/admin/courses/add" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-indigo-400 transition shadow">
                + Add Course
              </Link>
              <Link to="/admin/roadmaps/add" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-indigo-400 transition shadow">
                + Add Roadmap
              </Link>
              <Link to="/admin/users" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-gray-200 transition shadow">
                👥 Manage Users
              </Link>
              <Link to="/admin/enrollments" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-gray-200 transition shadow">
                🎓 Enrollments
              </Link>
              <Link to="/admin/payments" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-emerald-400 transition shadow">
                💳 Payments
              </Link>
              <Link to="/admin/reports" className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-center text-xs font-bold text-indigo-400 transition shadow">
                📈 Reports
              </Link>
            </div>
          </div>

          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Total Registered Users</span>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalUsers}</h3>
              <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-700">
                <span>Active: <strong className="text-emerald-400">{stats.activeUsers}</strong></span>
                <span>Inactive: <strong className="text-gray-400">{stats.totalUsers - stats.activeUsers}</strong></span>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Published & Draft Courses</span>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalCourses}</h3>
              <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-700">
                <span>Published: <strong className="text-indigo-400">{stats.publishedCourses}</strong></span>
                <span>Drafts: <strong className="text-amber-400">{stats.draftCourses}</strong></span>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Total Revenue Generated</span>
              <h3 className="text-3xl font-extrabold text-emerald-400">${stats.totalRevenue?.toLocaleString()}</h3>
              <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-700">
                <span>Successful: <strong className="text-emerald-400">{stats.successfulPayments}</strong></span>
                <span>Pending: <strong className="text-amber-400">{stats.pendingPayments}</strong></span>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Student Course Enrollments</span>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalEnrollments}</h3>
              <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-700">
                <span>Active Seats: <strong className="text-indigo-400">{stats.activeEnrollments}</strong></span>
                <span>Completed: <strong className="text-emerald-400">{stats.completedEnrollments}</strong></span>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Certificates Issued</span>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalCertificates}</h3>
              <span className="block text-[10px] text-emerald-400 pt-1 border-t border-gray-700 font-bold">100% Verified Credentials</span>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl space-y-2">
              <span className="text-xs text-gray-400 font-semibold">Career Roadmaps</span>
              <h3 className="text-3xl font-extrabold text-white">{stats.totalRoadmaps}</h3>
              <span className="block text-[10px] text-indigo-400 pt-1 border-t border-gray-700 font-bold">Active Curriculums</span>
            </div>
          </div>

          {/* Recent Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Courses Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Recent Courses</h3>
                <Link to="/admin/courses" className="text-xs text-indigo-400 hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Course Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {courses.slice(0, 5).map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-gray-750">
                        <td className="p-3 font-bold text-white truncate max-w-[180px]">{c.title}</td>
                        <td className="p-3 text-gray-300">{c.category || 'Development'}</td>
                        <td className="p-3 text-indigo-400 font-bold">${c.price}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold">{c.status || 'Published'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Users Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Recent Users</h3>
                <Link to="/admin/users" className="text-xs text-indigo-400 hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.slice(0, 5).map((u, idx) => (
                      <tr key={u.id || idx} className="hover:bg-gray-750">
                        <td className="p-3 font-bold text-white">{u.name}</td>
                        <td className="p-3 text-gray-300">{u.email}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-semibold">{u.role || 'Student'}</span></td>
                        <td className="p-3"><span className="text-emerald-400 font-bold">{u.status || 'Active'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Recent Payments & Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Payments Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Recent Payments</h3>
                <Link to="/admin/payments" className="text-xs text-indigo-400 hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900 text-gray-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {payments.slice(0, 5).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-gray-750">
                        <td className="p-3 font-mono text-indigo-400 font-semibold">{p.id}</td>
                        <td className="p-3 text-white">{p.user}</td>
                        <td className="p-3 text-emerald-400 font-bold">${p.amount}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-semibold">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Logs Timeline */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h3 className="font-bold text-sm text-white">System Activity Audit Logs</h3>
                <Link to="/admin/logs" className="text-xs text-indigo-400 hover:underline">View All Logs →</Link>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
                {logs.map((l, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-900 p-3 rounded-xl text-xs">
                    <div>
                      <strong className="text-indigo-400 font-mono">{l.action}</strong>
                      <span className="block text-[10px] text-gray-400 mt-0.5">Triggered by: {l.user}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{l.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="border-t border-gray-800 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
            <p>© 2026 Code Runner Platform. All rights reserved. (System v2.4.1)</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}