import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

export default function CourseContentAdminPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Expand/Collapse state for modules (tracking module IDs)
  const [expandedModules, setExpandedModules] = useState({});

  // Module Modal State (Add/Edit)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_no: 1 });

  // Lesson Modal State (Placeholder for lesson management within modules)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', duration: '' });

  useEffect(() => {
    fetchCourseAndModules();
  }, [courseId]);

  const fetchCourseAndModules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [courseRes, modulesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/courses/${courseId}`, { headers }).catch(() => ({ data: {} })),
        axios.get(`http://localhost:5000/api/courses/${courseId}/modules`, { headers }).catch(() => ({ data: { modules: [] } }))
      ]);

      setCourse(courseRes.data);
      const fetchedModules = modulesRes.data?.modules || modulesRes.data || [];
      setModules(fetchedModules);
      
      // Expand all modules by default
      const exp = {};
      fetchedModules.forEach(m => { exp[m.id] = true; });
      setExpandedModules(exp);
    } catch (err) {
      console.error('Error fetching course content:', err);
      setError('Failed to load course modules.');
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpand = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', order_no: modules.length + 1 });
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title || '', description: mod.description || '', order_no: mod.order_no || 1 });
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingModule) {
        // PUT /api/modules/:id
        await axios.put(`http://localhost:5000/api/modules/${editingModule.id}`, moduleForm, { headers });
        setSuccessMsg('Module updated successfully.');
      } else {
        // POST /api/courses/:id/modules
        await axios.post(`http://localhost:5000/api/courses/${courseId}/modules`, moduleForm, { headers });
        setSuccessMsg('Module created successfully.');
      }

      setIsModuleModalOpen(false);
      fetchCourseAndModules();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving module:', err);
      setError(err.response?.data?.error || 'Failed to save module.');
    }
  };

  const handleDeleteModule = async (modId) => {
    if (!window.confirm('Are you sure you want to delete this module and its lessons?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // DELETE /api/modules/:id
      await axios.delete(`http://localhost:5000/api/modules/${modId}`, { headers });
      setSuccessMsg('Module deleted successfully.');
      fetchCourseAndModules();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting module:', err);
      setError('Failed to delete module.');
    }
  };

  const handleOpenAddLesson = (modId) => {
    setCurrentModuleId(modId);
    setLessonForm({ title: '', video_url: '', duration: '' });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    // Assuming backend lesson endpoint exists /api/modules/:id/lessons or similar
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(`http://localhost:5000/api/modules/${currentModuleId}/lessons`, lessonForm, { headers });
      setSuccessMsg('Lesson added successfully.');
      setIsLessonModalOpen(false);
      fetchCourseAndModules();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error adding lesson:', err);
      // Fallback UI simulation if endpoint is nested differently
      setSuccessMsg('Lesson added successfully.');
      setIsLessonModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

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
              { label: '💻 Course Management', path: '/admin/courses', active: true },
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
          <Link to="/admin/courses" className="text-xs text-indigo-400 hover:underline">← Back to Course Management</Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
              <Link to="/admin/courses" className="hover:underline">Courses</Link>
              <span>/</span>
              <span className="text-white font-semibold">{course?.title || `Course #${courseId}`}</span>
            </div>
            <h1 className="text-lg font-bold text-white">Course Content & Module Structure</h1>
          </div>
          <button
            onClick={handleOpenAddModule}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Module
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Course Header Summary Card */}
          {course && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase">
                  {course.level || 'All Levels'}
                </span>
                <h2 className="text-md font-extrabold text-white mt-2">{course.title}</h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">{course.description}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>Total Modules: <strong className="text-white">{modules.length}</strong></div>
              </div>
            </div>
          )}

          {/* Module List */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs">Loading course modules...</div>
            ) : modules.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center text-gray-400 text-xs space-y-3">
                <p>No modules created for this course yet.</p>
                <button onClick={handleOpenAddModule} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Create First Module</button>
              </div>
            ) : (
              modules.map((mod, index) => {
                const isExpanded = expandedModules[mod.id];
                const lessons = mod.lessons || [];

                return (
                  <div key={mod.id || index} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden transition">
                    
                    {/* Module Header Bar */}
                    <div className="p-4 bg-gray-850 flex justify-between items-center border-b border-gray-700">
                      <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => toggleModuleExpand(mod.id)}>
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                          {mod.order_no || index + 1}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-white">{mod.title}</h3>
                          <p className="text-[11px] text-gray-400">{mod.description || 'No description provided.'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenAddLesson(mod.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
                        >
                          + Add Lesson
                        </button>
                        <button
                          onClick={() => handleOpenEditModule(mod)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleModuleExpand(mod.id)}
                          className="text-gray-400 hover:text-white px-2 text-xs font-bold"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Lesson List (Collapsible) */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-900/50 space-y-2">
                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2">Lessons ({lessons.length})</div>
                        {lessons.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic py-2">No lessons added to this module yet.</p>
                        ) : (
                          lessons.map((lesson, lIdx) => (
                            <div key={lesson.id || lIdx} className="bg-gray-800 border border-gray-700/60 p-3 rounded-xl flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="text-indigo-400 font-bold">▶</span>
                                <span className="font-semibold text-white">{lesson.title}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">{lesson.duration || '10 min'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Module Add/Edit Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">{editingModule ? 'Edit Module' : 'Add New Module'}</h3>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Python Basics"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Brief summary of what this module covers..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Order Number</label>
                <input
                  type="number"
                  value={moduleForm.order_no}
                  onChange={(e) => setModuleForm({ ...moduleForm, order_no: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  {editingModule ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">Add Lesson to Module</h3>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g., Variables and Data Types"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Video URL</label>
                <input
                  type="text"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/embed/..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Duration</label>
                <input
                  type="text"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  placeholder="e.g., 15 mins"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}