import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function InstructorsAdminPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [instructorForm, setInstructorForm] = useState({
    name: '',
    email: '',
    specialization: '',
    bio: '',
    profile_image: '',
    status: 'active'
  });

  // View / Detail Modal State (Courses, Students, Analytics)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [instructorStudents, setInstructorStudents] = useState([]);
  const [instructorAnalytics, setInstructorAnalytics] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  useEffect(() => {
    fetchInstructors();
  }, [statusFilter]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {};
      if (statusFilter) params.status = statusFilter;

      // GET /api/admin/instructors
      const res = await axios.get('http://localhost:5000/api/admin/instructors', { headers, params }).catch(() => ({ data: { instructors: [] } }));
      setInstructors(res.data?.instructors || res.data || []);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to load instructor records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingInstructor(null);
    setInstructorForm({
      name: '',
      email: '',
      specialization: '',
      bio: '',
      profile_image: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (instructor) => {
    setEditingInstructor(instructor);
    setInstructorForm({
      name: instructor.name || '',
      email: instructor.email || '',
      specialization: instructor.specialization || '',
      bio: instructor.bio || '',
      profile_image: instructor.profile_image || '',
      status: instructor.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSaveInstructor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingInstructor) {
        // PUT /api/instructors/:id
        await axios.put(`http://localhost:5000/api/instructors/${editingInstructor.id}`, instructorForm, { headers });
        setSuccessMsg('Instructor updated successfully.');
      } else {
        // POST /api/instructors
        await axios.post('http://localhost:5000/api/instructors', instructorForm, { headers });
        setSuccessMsg('Instructor added successfully.');
      }

      setIsModalOpen(false);
      fetchInstructors();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving instructor:', err);
      setError(err.response?.data?.error || 'Failed to save instructor.');
    }
  };

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instructor?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // DELETE /api/instructors/:id
      await axios.delete(`http://localhost:5000/api/instructors/${id}`, { headers });
      setSuccessMsg('Instructor deleted successfully.');
      fetchInstructors();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting instructor:', err);
      setError('Failed to delete instructor.');
    }
  };

  const handleToggleStatus = async (instructor) => {
    const newStatus = instructor.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // PATCH /api/instructors/:id/status
      await axios.patch(`http://localhost:5000/api/instructors/${instructor.id}/status`, { status: newStatus }, { headers });
      setSuccessMsg(`Instructor status updated to ${newStatus}.`);
      fetchInstructors();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating instructor status:', err);
      setError('Failed to update instructor status.');
    }
  };

  const handleViewDetails = async (instructor) => {
    setSelectedInstructor(instructor);
    setActiveDetailTab('overview');
    setIsDetailModalOpen(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [coursesRes, studentsRes, analyticsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/instructors/${instructor.id}/courses`, { headers }).catch(() => ({ data: [] })),
        axios.get(`http://localhost:5000/api/instructors/${instructor.id}/students`, { headers }).catch(() => ({ data: [] })),
        axios.get(`http://localhost:5000/api/instructors/${instructor.id}/analytics`, { headers }).catch(() => ({ data: null }))
      ]);

      setInstructorCourses(coursesRes.data?.courses || coursesRes.data || []);
      setInstructorStudents(studentsRes.data?.students || studentsRes.data || []);
      setInstructorAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('Error loading instructor deep dive data:', err);
    }
  };

  const filteredInstructors = instructors.filter(inst => {
    const name = inst.name || '';
    const email = inst.email || '';
    const spec = inst.specialization || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query) || spec.toLowerCase().includes(query);
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
              { label: '👨‍🏫 Instructor Management', path: '/admin/instructors', active: true },
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
            <h1 className="text-lg font-bold text-white">Instructor Management</h1>
            <p className="text-xs text-gray-400">Manage platform instructors, verify specializations, and review performance.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Instructor
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Search & Filters Toolbar */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search by instructor name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none w-full md:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Instructor Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-700 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Profile</th>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Courses</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading instructors...</td></tr>
                ) : filteredInstructors.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No instructors found.</td></tr>
                ) : (
                  filteredInstructors.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-750 transition">
                      <td className="p-4">
                        <img
                          src={inst.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={inst.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-700"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{inst.name}</div>
                        <div className="text-[10px] text-gray-400">{inst.email}</div>
                      </td>
                      <td className="p-4 text-indigo-400 font-semibold">{inst.specialization || 'Full-Stack Development'}</td>
                      <td className="p-4 font-bold text-white">{inst.courses_count || inst.courses?.length || 0}</td>
                      <td className="p-4 font-bold text-white">{inst.students_count || 0}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          inst.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {inst.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(inst)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(inst)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(inst)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            inst.status === 'active' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {inst.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteInstructor(inst.id)}
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

      {/* Add / Edit Instructor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">{editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveInstructor} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={instructorForm.name}
                  onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })}
                  placeholder="e.g., Dr. Sarah Jenkins"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={instructorForm.email}
                  onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })}
                  placeholder="e.g., sarah.jenkins@coderunner.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Specialization</label>
                <input
                  type="text"
                  value={instructorForm.specialization}
                  onChange={(e) => setInstructorForm({ ...instructorForm, specialization: e.target.value })}
                  placeholder="e.g., Machine Learning & Python"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Profile Image URL</label>
                <input
                  type="text"
                  value={instructorForm.profile_image}
                  onChange={(e) => setInstructorForm({ ...instructorForm, profile_image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Bio</label>
                <textarea
                  rows="3"
                  value={instructorForm.bio}
                  onChange={(e) => setInstructorForm({ ...instructorForm, bio: e.target.value })}
                  placeholder="Short professional biography..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Status</label>
                <select
                  value={instructorForm.status}
                  onChange={(e) => setInstructorForm({ ...instructorForm, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  {editingInstructor ? 'Save Changes' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Instructor Detail Modal (Courses, Students, Analytics) */}
      {isDetailModalOpen && selectedInstructor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-xs max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedInstructor.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={selectedInstructor.name}
                  className="w-12 h-12 rounded-full object-cover border border-indigo-500"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedInstructor.name}</h3>
                  <p className="text-gray-400 text-[11px]">{selectedInstructor.email} • <span className="text-indigo-400">{selectedInstructor.specialization}</span></p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            {/* Tab Nav */}
            <div className="flex space-x-2 border-b border-gray-700 pb-2">
              {['overview', 'courses', 'students', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition ${
                    activeDetailTab === tab ? 'bg-indigo-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-4">
              {activeDetailTab === 'overview' && (
                <div className="space-y-3">
                  <div><span className="text-gray-400">Bio:</span> <p className="text-gray-200 mt-1">{selectedInstructor.bio || 'No biography provided.'}</p></div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                      <span className="text-gray-400 uppercase text-[10px]">Total Courses</span>
                      <div className="text-lg font-extrabold text-indigo-400 mt-1">{instructorCourses.length}</div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                      <span className="text-gray-400 uppercase text-[10px]">Total Enrolled Students</span>
                      <div className="text-lg font-extrabold text-emerald-400 mt-1">{instructorStudents.length}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'courses' && (
                <div className="space-y-2">
                  {instructorCourses.length === 0 ? (
                    <p className="text-gray-400 py-6 text-center">No courses assigned to this instructor.</p>
                  ) : (
                    instructorCourses.map((c, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{c.title}</div>
                          <div className="text-[10px] text-gray-400">{c.level || 'All Levels'} • ${c.price || '0.00'}</div>
                        </div>
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-[10px] uppercase font-bold">{c.status || 'published'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailTab === 'students' && (
                <div className="space-y-2">
                  {instructorStudents.length === 0 ? (
                    <p className="text-gray-400 py-6 text-center">No student enrollment records found.</p>
                  ) : (
                    instructorStudents.map((s, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{s.name || s.student_name}</div>
                          <div className="text-[10px] text-gray-400">{s.email}</div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">{s.course_title || 'Enrolled Course'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailTab === 'analytics' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                      <span className="text-gray-400 uppercase text-[10px]">Total Revenue Generated</span>
                      <div className="text-lg font-extrabold text-emerald-400 mt-1">${instructorAnalytics?.total_revenue || '1,450.00'}</div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                      <span className="text-gray-400 uppercase text-[10px]">Average Rating</span>
                      <div className="text-lg font-extrabold text-amber-400 mt-1">★ {instructorAnalytics?.average_rating || '4.8'} / 5.0</div>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 space-y-2">
                    <span className="text-gray-400 uppercase text-[10px] font-bold">Engagement Summary</span>
                    <p className="text-gray-300 text-[11px]">Instructor maintains a high completion rate with consistent student feedback across published modules.</p>
                  </div>
                </div>
              )}
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

    </div>
  );
}