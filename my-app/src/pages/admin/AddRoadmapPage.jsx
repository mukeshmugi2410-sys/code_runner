import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AddRoadmapPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options
  const [categories, setCategories] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    level: 'beginner',
    thumbnail: '',
    status: 'draft'
  });

  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get('http://localhost:5000/api/categories', { headers });
      const catList = res.data?.categories || [];
      setCategories(catList);

      if (catList.length > 0) {
        setFormData(prev => ({ ...prev, category_id: catList[0].id }));
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      console.log('Thumbnail upload endpoint fallback: Using preview state.');
    }
  };

  const handleSubmit = async (e, targetStatus = 'published') => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.category_id) {
      setError('Please fill in all required fields (Title, Description, and Category).');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        ...formData,
        status: targetStatus,
        category_id: Number(formData.category_id)
      };

      await axios.post('http://localhost:5000/api/roadmaps', payload, { headers });

      setSuccessMsg(`Roadmap successfully ${targetStatus === 'draft' ? 'saved as draft' : 'created'}!`);
      setTimeout(() => {
        navigate('/admin/roadmaps');
      }, 1200);
    } catch (err) {
      console.error('Error creating roadmap:', err);
      setError(err.response?.data?.error || 'Failed to create roadmap. Please try again.');
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
              <Link to="/admin/roadmaps" className="hover:underline">Roadmaps</Link> / Add New Roadmap
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">Create New Roadmap</h1>
          </div>
          <Link
            to="/admin/roadmaps"
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
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Roadmap Details</h2>
              
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Roadmap Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Full-Stack Web Development Masterplan"
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
                  placeholder="Describe the overall objective and career path for this roadmap..."
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
              </div>
            </div>

            {/* Section: Thumbnail Upload */}
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-700 pb-2">Roadmap Thumbnail</h2>
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
                {loading ? 'Creating...' : 'Create Roadmap'}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}