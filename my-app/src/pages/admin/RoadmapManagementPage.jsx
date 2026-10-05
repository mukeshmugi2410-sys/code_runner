import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function RoadmapManagementPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & Navigation state
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fallback endpoint handling if admin route differs
      const res = await axios.get('http://localhost:5000/api/admin/roadmaps', { headers })
        .catch(() => axios.get('http://localhost:5000/api/roadmaps', { headers }));

      setRoadmaps(res.data?.roadmaps || res.data || []);
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      setError('Failed to load roadmaps.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewModal = async (roadmap) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/roadmaps/${roadmap.id}`, { headers });
      setSelectedRoadmap(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error('Error fetching roadmap details:', err);
      setSelectedRoadmap(roadmap);
      setIsViewModalOpen(true);
    }
  };

  const handleOpenDeleteModal = (roadmap) => {
    setRoadmapToDelete(roadmap);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRoadmap = async () => {
    if (!roadmapToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/roadmaps/${roadmapToDelete.id}`, { headers });
      setSuccessMsg('Roadmap deleted successfully!');
      setIsDeleteModalOpen(false);
      setRoadmapToDelete(null);
      fetchRoadmaps();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting roadmap:', err);
      setError(err.response?.data?.error || 'Failed to delete roadmap.');
      setIsDeleteModalOpen(false);
    }
  };

  const filteredRoadmaps = roadmaps.filter((r) => {
    const matchesSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? r.category === categoryFilter || r.category_id == categoryFilter : true;
    const matchesLevel = levelFilter ? r.level === levelFilter : true;
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
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
              { label: '🗺️ Roadmap Management', path: '/admin/roadmaps', active: true },
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
            <div className="text-xs text-gray-400">Admin / Roadmaps</div>
            <h1 className="text-lg font-bold text-white mt-0.5">Roadmap Management</h1>
          </div>
          <Link
            to="/admin/roadmaps/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Roadmap
          </Link>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Filters & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-800 border border-gray-700 p-4 rounded-2xl shadow">
            <div>
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Development">Development</option>
                <option value="AI / ML">AI / ML</option>
                <option value="DevOps">DevOps</option>
              </select>
            </div>
            <div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Roadmap Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400 animate-pulse">Loading roadmaps...</div>
            ) : filteredRoadmaps.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No roadmaps found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900/60 border-b border-gray-700 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Thumbnail</th>
                      <th className="p-4">Roadmap Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Level</th>
                      <th className="p-4">Stages</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredRoadmaps.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-750 transition">
                        <td className="p-4">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="w-12 h-8 object-cover rounded-lg border border-gray-700" />
                          ) : (
                            <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] text-gray-500 border border-gray-700">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-white">{item.title}</td>
                        <td className="p-4 text-gray-300">{item.category || item.category_name || 'General'}</td>
                        <td className="p-4 capitalize text-gray-400">{item.level || 'Beginner'}</td>
                        <td className="p-4 text-gray-300">{item.stages?.length || item.stages_count || 4} Stages</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.status || 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '2026-10-04'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-[10px] font-semibold transition"
                          >
                            View
                          </button>
                          <Link
                            to={`/admin/roadmaps/${item.id}/edit`}
                            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-semibold transition inline-block"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/admin/roadmaps/${item.id}/stages`}
                            className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-semibold transition inline-block"
                          >
                            Stages
                          </Link>
                          <button
                            onClick={() => handleOpenDeleteModal(item)}
                            className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedRoadmap && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">{selectedRoadmap.title}</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <p className="text-xs text-gray-300">{selectedRoadmap.description || 'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                <span className="text-gray-500 block uppercase text-[10px]">Category</span>
                <span className="font-bold text-white">{selectedRoadmap.category || 'General'}</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                <span className="text-gray-500 block uppercase text-[10px]">Level</span>
                <span className="font-bold text-white capitalize">{selectedRoadmap.level || 'Beginner'}</span>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && roadmapToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
              !
            </div>
            <h3 className="text-sm font-bold text-white">Delete Roadmap</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete <span className="font-bold text-white">{roadmapToDelete.title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoadmap}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}