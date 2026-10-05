import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options (storing full objects to easily access IDs)
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    instructor_id: '',
    level: 'beginner',
    duration: '',
    price: '',
    discount_price: '',
    language: 'English',
    requirements: '',
    objectives: '',
    status: 'draft'
  });

  // Thumbnail upload state
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [catRes, instRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories', { headers }).catch(() => ({ data: { categories: [] } })),
        axios.get('http://localhost:5000/api/admin/instructors', { headers }).catch(() => ({ data: { instructors: [] } }))
      ]);

      const catList = catRes.data?.categories || [];
      const instList = instRes.data?.instructors || [
        { id: 1, name: 'Bob Johnson' },
        { id: 2, name: 'Dr. Alan Turing' },
        { id: 3, name: 'Jane Doe' }
      ];

      setCategories(catList);
      setInstructors(instList);

      // Set default IDs if available
      if (catList.length > 0) {
        setFormData(prev => ({ ...prev, category_id: catList[0].id }));
      }
      if (instList.length > 0) {
        setFormData(prev => ({ ...prev, instructor_id: instList[0].id }));
      }
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));

    try {
      const uploadData = new FormData();
      uploadData.append('thumbnail', file);

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post('http://localhost:5000/api/upload/course-thumbnail', uploadData, { headers });
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, thumbnail: res.data.url }));
      }
    } catch (err) {
      console.log('Thumbnail upload endpoint fallback: Using local object URL preview.');
    }
  };

  const handleSubmit = async (e, targetStatus = 'published') => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.category_id || !formData.instructor_id) {
      setError('Please fill in all required fields (Title, Description, Category, and Instructor).');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        ...formData,
        status: targetStatus,
        price: formData.price ? Number(formData.price) : 0.00,
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        category_id: Number(formData.category_id),
        instructor_id: Number(formData.instructor_id)
      };

      await axios.post('http://localhost:5000/api/courses', payload, { headers });

      setSuccessMsg(`Course successfully ${targetStatus === 'draft' ? 'saved as draft' : 'created'}!`);
      setTimeout(() => {
        navigate('/admin/courses');
      }, 1200);
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err.response?.data?.error || 'Failed to create course. Please check your inputs.');
    } finally {
      setLoading(false);
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
            <div className="text-xs text-gray-400">
              <Link to="/admin/courses" className="hover:underline">Courses</Link> / Add New Course
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">Create New Course</h1>
          </div>
          <Link
            to="/admin/courses"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </Link>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          <form onSubmit={(e) => handleSubmit(e, 'published')} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Basic Course Details</h2>
              
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Course Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Advanced Full-Stack Architecture & Microservices"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Description *</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  placeholder="Provide a comprehensive summary of what students will learn..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

            
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Duration (Hours)</label>
                  <input
                    type="text"
                    name="duration"
                    placeholder="e.g., 12"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Language</label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Pricing */}
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    placeholder="49.99"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Discount Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_price"
                    placeholder="29.99"
                    value={formData.discount_price}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section: Thumbnail Upload */}
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Course Thumbnail</h2>
              <div className="flex items-center space-x-6">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Preview" className="w-28 h-18 object-cover rounded-xl border border-gray-700 shadow" />
                ) : (
                  <div className="w-28 h-18 bg-gray-900 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-[10px] text-gray-500 text-center p-2">
                    No image selected
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Recommended size: 1280x720 pixels (PNG, JPG)</p>
                </div>
              </div>
            </div>

            {/* Section: Requirements & Objectives */}
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Prerequisites & Learning Outcomes</h2>
              
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Requirements</label>
                <textarea
                  name="requirements"
                  rows="3"
                  placeholder="Basic knowledge of Python & JavaScript..."
                  value={formData.requirements}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Learning Objectives</label>
                <textarea
                  name="objectives"
                  rows="3"
                  placeholder="Build production-grade REST APIs, Implement user authentication..."
                  value={formData.objectives}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={loading}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}