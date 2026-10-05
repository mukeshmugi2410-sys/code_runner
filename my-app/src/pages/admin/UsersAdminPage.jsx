import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // User Detail / Edit Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailTab, setUserDetailTab] = useState('courses'); // courses, progress, certificates, payments
  const [userRelatedData, setUserRelatedData] = useState({ courses: [], progress: [], certificates: [], payments: [] });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'student', status: 'active' });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get('http://localhost:5000/api/admin/users', { headers, params });
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user records.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.patch(`http://localhost:5000/api/users/${userId}/status`, { status: newStatus }, { headers });
      setSuccessMsg(`User status updated to ${newStatus}`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/users/${userId}`, { headers });
      setSuccessMsg('User deleted successfully.');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user.');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ name: user.name || '', email: user.email || '', role: user.role || 'student', status: user.status || 'active' });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, editForm, { headers });
      setSuccessMsg('User updated successfully.');
      setIsEditModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
    setUserDetailTab('courses');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [coursesRes, progressRes, certsRes, paymentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/users/${user.id}/courses`, { headers }).catch(() => ({ data: { courses: [] } })),
        axios.get(`http://localhost:5000/api/users/${user.id}/progress`, { headers }).catch(() => ({ data: { progress: [] } })),
        axios.get(`http://localhost:5000/api/users/${user.id}/certificates`, { headers }).catch(() => ({ data: { certificates: [] } })),
        axios.get(`http://localhost:5000/api/users/${user.id}/payments`, { headers }).catch(() => ({ data: { payments: [] } }))
      ]);

      setUserRelatedData({
        courses: coursesRes.data?.courses || [],
        progress: progressRes.data?.progress || [],
        certificates: certsRes.data?.certificates || [],
        payments: paymentsRes.data?.payments || []
      });
    } catch (err) {
      console.error('Error fetching user related data:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              { label: '👥 User Management', path: '/admin/users', active: true },
              { label: '💻 Course Management', path: '/admin/courses' },
              { label: '📂 Category Management', path: '/admin/categories' },
              { label: '🗺️ Roadmap Management', path: '/admin/roadmaps' },
              { label: '🎓 Enrollment Management', path: '/admin/enrollments' },
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
            <h1 className="text-lg font-bold text-white">User Management</h1>
            <p className="text-xs text-gray-400">Monitor and manage platform users, roles, and status.</p>
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex space-x-3 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-700 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Profile</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-750 transition">
                      <td className="p-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold uppercase text-xs border border-indigo-500/30">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-white">{user.name}</td>
                      <td className="p-4 text-gray-300">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          user.status === 'inactive' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetails(user)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            user.status === 'inactive' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold"
                        >
                          Delete
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

      {/* User Details Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">User Details: {selectedUser.name}</h3>
                <p className="text-[11px] text-gray-400">{selectedUser.email}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-gray-700 pb-3 text-xs">
              {['courses', 'progress', 'certificates', 'payments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setUserDetailTab(tab)}
                  className={`px-4 py-2 rounded-xl font-bold capitalize transition ${
                    userDetailTab === tab ? 'bg-indigo-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-3 text-xs">
              {userDetailTab === 'courses' && (
                userRelatedData.courses.length === 0 ? <p className="text-gray-400 text-center py-6">No enrolled courses.</p> :
                userRelatedData.courses.map((c, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-white">{c.title || c.course_title}</span>
                    <span className="text-gray-400">Enrolled: {c.enrolled_at ? new Date(c.enrolled_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                ))
              )}

              {userDetailTab === 'progress' && (
                userRelatedData.progress.length === 0 ? <p className="text-gray-400 text-center py-6">No progress records found.</p> :
                userRelatedData.progress.map((p, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-white">{p.course_title || 'Course Progress'}</span>
                    <span className="text-indigo-400 font-semibold">{p.progress_percentage || 0}% Complete</span>
                  </div>
                ))
              )}

              {userDetailTab === 'certificates' && (
                userRelatedData.certificates.length === 0 ? <p className="text-gray-400 text-center py-6">No certificates earned yet.</p> :
                userRelatedData.certificates.map((cert, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-white">🏆 {cert.title || cert.course_title}</span>
                    <span className="text-gray-400">Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                ))
              )}

              {userDetailTab === 'payments' && (
                userRelatedData.payments.length === 0 ? <p className="text-gray-400 text-center py-6">No payment history.</p> :
                userRelatedData.payments.map((pay, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">💳 {pay.description || 'Course Purchase'}</span>
                      <span className="block text-[10px] text-gray-500">{pay.created_at ? new Date(pay.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">${pay.amount || '0.00'}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-700">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Edit User</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}