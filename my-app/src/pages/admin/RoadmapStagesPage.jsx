import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

export default function RoadmapStagesPage() {
  const { id } = useParams(); // Roadmap ID
  const [roadmap, setRoadmap] = useState(null);
  const [stages, setStages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ title: '', description: '', order_no: 1 });

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [roadmapRes, stagesRes, coursesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/roadmaps/${id}`, { headers }),
        axios.get(`http://localhost:5000/api/roadmaps/${id}/stages`, { headers }),
        axios.get('http://localhost:5000/api/courses', { headers }).catch(() => ({ data: { courses: [] } }))
      ]);

      setRoadmap(roadmapRes.data);
      setStages(stagesRes.data?.stages || []);
      setCourses(coursesRes.data?.courses || []);
    } catch (err) {
      console.error('Error fetching roadmap stages:', err);
      setError('Failed to load roadmap stages and courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddStageModal = () => {
    setEditingStage(null);
    setStageForm({ title: '', description: '', order_no: stages.length + 1 });
    setIsStageModalOpen(true);
  };

  const handleOpenEditStageModal = (stage) => {
    setEditingStage(stage);
    setStageForm({ title: stage.title, description: stage.description || '', order_no: stage.order_no || 1 });
    setIsStageModalOpen(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingStage) {
        // PUT /api/roadmap-stages/:id
        await axios.put(`http://localhost:5000/api/roadmap-stages/${editingStage.id}`, stageForm, { headers });
        setSuccessMsg('Stage updated successfully!');
      } else {
        // POST /api/roadmaps/:id/stages
        await axios.post(`http://localhost:5000/api/roadmaps/${id}/stages`, stageForm, { headers });
        setSuccessMsg('Stage created successfully!');
      }

      setIsStageModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving stage:', err);
      setError(err.response?.data?.error || 'Failed to save stage.');
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Are you sure you want to delete this stage?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/roadmap-stages/${stageId}`, { headers });
      setSuccessMsg('Stage deleted successfully!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError('Failed to delete stage.');
    }
  };

  const handleOpenAddCourseModal = (stageId) => {
    setSelectedStageId(stageId);
    setSelectedCourseId(courses[0]?.id || '');
    setIsCourseModalOpen(true);
  };

  const handleAddCourseToStage = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // POST /api/roadmap-stages/:id/courses
      await axios.post(`http://localhost:5000/api/roadmap-stages/${selectedStageId}/courses`, { course_id: selectedCourseId }, { headers });
      setSuccessMsg('Course attached to stage successfully!');
      setIsCourseModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error attaching course:', err);
      setError(err.response?.data?.error || 'Failed to attach course.');
    }
  };

  const handleRemoveCourse = async (roadmapCourseId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // DELETE /api/roadmap-courses/:id
      await axios.delete(`http://localhost:5000/api/roadmap-courses/${roadmapCourseId}`, { headers });
      setSuccessMsg('Course removed from stage!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error removing course:', err);
      setError('Failed to remove course.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Roadmap Stages...</div>
      </div>
    );
  }

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
            <div className="text-xs text-gray-400">
              <Link to="/admin/roadmaps" className="hover:underline">Roadmaps</Link> / Stages
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">{roadmap?.title || 'Roadmap'} — Stages</h1>
          </div>
          <button
            onClick={handleOpenAddStageModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Stage
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          <div className="space-y-6">
            {stages.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center text-xs text-gray-400">
                No stages found for this roadmap. Click "+ Add Stage" to get started.
              </div>
            ) : (
              stages.map((stage, index) => (
                <div key={stage.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Stage {index + 1} (Order: {stage.order_no || index + 1})</div>
                      <h2 className="text-sm font-bold text-white mt-0.5">{stage.title}</h2>
                      <p className="text-xs text-gray-300 mt-1">{stage.description || 'No stage description.'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditStageModal(stage)}
                        className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-[10px] font-semibold transition"
                      >
                        Edit Stage
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-semibold transition"
                      >
                        Delete Stage
                      </button>
                    </div>
                  </div>

                  {/* Associated Courses List */}
                  <div className="space-y-2">
                    <div className="text-xs uppercase font-bold text-gray-400 flex justify-between items-center">
                      <span>Mapped Courses</span>
                      <button
                        onClick={() => handleOpenAddCourseModal(stage.id)}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        + Add Course
                      </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800 text-xs">
                      {stage.courses && stage.courses.length > 0 ? (
                        stage.courses.map((c) => (
                          <div key={c.id || c.roadmap_course_id} className="p-3 flex justify-between items-center">
                            <span className="font-medium text-white">📁 {c.title || c.course_title}</span>
                            <button
                              onClick={() => handleRemoveCourse(c.roadmap_course_id || c.id)}
                              className="text-red-400 hover:text-red-300 text-[10px] font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-[11px]">No courses attached to this stage yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Stage Modal (Create / Edit) */}
      {isStageModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">{editingStage ? 'Edit Stage' : 'Add New Stage'}</h3>
              <button onClick={() => setIsStageModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveStage} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Stage Title *</label>
                <input
                  type="text"
                  required
                  value={stageForm.title}
                  onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })}
                  placeholder="e.g., Python Fundamentals"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={stageForm.description}
                  onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                  placeholder="Brief summary of this stage..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Order No</label>
                <input
                  type="number"
                  value={stageForm.order_no}
                  onChange={(e) => setStageForm({ ...stageForm, order_no: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Attach Course to Stage</h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCourseToStage} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Select Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Attach Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}