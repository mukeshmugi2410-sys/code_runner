import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

export default function LessonAdminPage() {
  const { courseId, moduleId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lesson Modal State (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    lesson_type: 'video',
    video_url: '',
    content: '',
    duration: '',
    order_no: 1,
    is_free: false,
    status: 'active'
  });

  useEffect(() => {
    fetchLessons();
  }, [moduleId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [lessonsRes, moduleRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/modules/${moduleId}/lessons`, { headers }).catch(() => ({ data: { lessons: [] } })),
        axios.get(`http://localhost:5000/api/courses/${courseId}/modules`, { headers }).catch(() => ({ data: { modules: [] } }))
      ]);

      const fetchedLessons = lessonsRes.data?.lessons || lessonsRes.data || [];
      setLessons(fetchedLessons);

      const modules = moduleRes.data?.modules || moduleRes.data || [];
      const currentMod = modules.find(m => String(m.id) === String(moduleId));
      setModuleInfo(currentMod || { title: `Module #${moduleId}` });
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      description: '',
      lesson_type: 'video',
      video_url: '',
      content: '',
      duration: '',
      order_no: lessons.length + 1,
      is_free: false,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`http://localhost:5000/api/lessons/${lessonId}`, { headers });
      const lesson = res.data;
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title || '',
        description: lesson.description || '',
        lesson_type: lesson.lesson_type || 'video',
        video_url: lesson.video_url || '',
        content: lesson.content || '',
        duration: lesson.duration || '',
        order_no: lesson.order_no || 1,
        is_free: lesson.is_free || false,
        status: lesson.status || 'active'
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching lesson details:', err);
      setError('Failed to load lesson details for editing.');
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingLesson) {
        // PUT /api/lessons/:id
        await axios.put(`http://localhost:5000/api/lessons/${editingLesson.id}`, lessonForm, { headers });
        setSuccessMsg('Lesson updated successfully.');
      } else {
        // POST /api/modules/:id/lessons
        await axios.post(`http://localhost:5000/api/modules/${moduleId}/lessons`, lessonForm, { headers });
        setSuccessMsg('Lesson created successfully.');
      }

      setIsModalOpen(false);
      fetchLessons();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError(err.response?.data?.error || 'Failed to save lesson.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // DELETE /api/lessons/:id
      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, { headers });
      setSuccessMsg('Lesson deleted successfully.');
      fetchLessons();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError('Failed to delete lesson.');
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
          <Link to={`/admin/courses/${courseId}/content`} className="text-xs text-indigo-400 hover:underline">← Back to Course Modules</Link>
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
              <Link to={`/admin/courses/${courseId}/content`} className="hover:underline">Modules</Link>
              <span>/</span>
              <span className="text-white font-semibold">{moduleInfo?.title || 'Module Lessons'}</span>
            </div>
            <h1 className="text-lg font-bold text-white">Lesson Management</h1>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Lesson
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Lessons Table / List */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 border-b border-gray-700 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Access</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading lessons...</td></tr>
                ) : lessons.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No lessons found in this module.</td></tr>
                ) : (
                  lessons.map((lesson, index) => (
                    <tr key={lesson.id || index} className="hover:bg-gray-750 transition">
                      <td className="p-4 font-bold text-indigo-400">#{lesson.order_no || index + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{lesson.title}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{lesson.description}</div>
                      </td>
                      <td className="p-4 uppercase text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-gray-900 text-gray-300 border border-gray-700 font-semibold">
                          {lesson.lesson_type || 'video'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{lesson.duration || '10 mins'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          lesson.is_free ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {lesson.is_free ? 'Free Preview' : 'Paid / Locked'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          lesson.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {lesson.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(lesson.id)}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
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

      {/* Add/Edit Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-sm font-bold text-white">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g., Understanding Functions & Scope"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-gray-400 mb-1">Lesson Type</label>
                  <select
                    value={lessonForm.lesson_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                    <option value="pdf">PDF</option>
                    <option value="coding">Coding</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-gray-400 mb-1">Duration</label>
                  <input
                    type="text"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    placeholder="e.g., 15 mins"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {lessonForm.lesson_type === 'video' && (
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
              )}

              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Short summary of this lesson..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-gray-400 mb-1">Content / Body / Instructions</label>
                <textarea
                  rows="3"
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Detailed lesson content or exercise instructions..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase font-bold text-gray-400 mb-1">Order #</label>
                  <input
                    type="number"
                    value={lessonForm.order_no}
                    onChange={(e) => setLessonForm({ ...lessonForm, order_no: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-gray-400 mb-1">Access</label>
                  <select
                    value={lessonForm.is_free ? 'true' : 'false'}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.value === 'true' })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="false">Paid / Locked</option>
                    <option value="true">Free Preview</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-gray-400 mb-1">Status</label>
                  <select
                    value={lessonForm.status}
                    onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
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
                  {editingLesson ? 'Save Changes' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}