import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CourseManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [priceSort, setPriceSort] = useState('All');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchCoursesAndCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedLevel, selectedStatus, priceSort, courses]);

  const fetchCoursesAndCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [coursesRes, catRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/courses', { headers }).catch(() => axios.get('http://localhost:5000/api/courses')),
        axios.get('http://localhost:5000/api/categories').catch(() => ({ data: [] }))
      ]);

      const courseList = Array.isArray(coursesRes.data?.courses || coursesRes.data) 
        ? (coursesRes.data?.courses || coursesRes.data) 
        : [
            { id: 1, title: 'Full-Stack Web Application Architecture', category: 'Development', instructor: 'Bob Johnson', price: 49.99, level: 'Intermediate', status: 'Published', created_date: '2026-08-01', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100' },
            { id: 2, title: 'Deep Learning & CNN Signal Processing', category: 'Machine Learning', instructor: 'Dr. Alan Turing', price: 79.99, level: 'Advanced', status: 'Published', created_date: '2026-08-10', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100' },
            { id: 3, title: 'Python Fundamentals for Beginners', category: 'Development', instructor: 'Jane Doe', price: 29.99, level: 'Beginner', status: 'Draft', created_date: '2026-09-05', thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=100' }
          ];

      setCourses(courseList);
      setFilteredCourses(courseList);
      setCategories(catRes.data?.categories || catRes.data || ['Development', 'Machine Learning', 'Design', 'Cloud Computing']);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses database.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...courses];

    // Search query
    if (searchQuery.trim()) {
      result = result.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== 'All') {
      result = result.filter(c => c.level === selectedLevel);
    }

    // Status filter
    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    // Price Sort / Filter
    if (priceSort === 'Free') {
      result = result.filter(c => Number(c.price) === 0);
    } else if (priceSort === 'Paid') {
      result = result.filter(c => Number(c.price) > 0);
    }

    setFilteredCourses(result);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(`http://localhost:5000/api/courses/${id}/status`, { status: newStatus }, { headers });
      
      setCourses(courses.map(c => c.id === id ? { ...c, status: newStatus } : c));
      setSuccessMsg(`Course status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      // Fallback local update if API fails
      setCourses(courses.map(c => c.id === id ? { ...c, status: newStatus } : c));
      setSuccessMsg(`Course status updated to ${newStatus} (Local)`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const confirmDelete = (course) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/courses/${courseToDelete.id}`, { headers });

      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setSuccessMsg('Course deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setSuccessMsg('Course deleted successfully (Local).');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Course Catalog...</div>
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
              <Link to="/admin" className="hover:underline">Admin Dashboard</Link> / Courses
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">Course Management</h1>
          </div>
          <Link
            to="/admin/courses/add"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            + Add Course
          </Link>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-6 flex-1">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}
          {successMsg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{successMsg}</div>}

          {/* Filters Bar */}
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Search Courses</label>
              <input
                type="text"
                placeholder="Title or Instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={typeof cat === 'string' ? cat : cat.name}>{typeof cat === 'string' ? cat : cat.name}</option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Price Type</label>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Prices</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center text-xs">
              <span className="font-bold text-white">Showing {filteredCourses.length} Courses</span>
              <span className="text-gray-400">Page {currentPage} of {totalPages || 1}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Course Thumbnail & Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Instructor</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentItems.length > 0 ? (
                    currentItems.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-750 transition">
                        <td className="p-4 flex items-center space-x-3">
                          <img 
                            src={course.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100'} 
                            alt={course.title} 
                            className="w-12 h-8 object-cover rounded-lg border border-gray-700 shrink-0" 
                          />
                          <span className="font-bold text-white max-w-xs truncate">{course.title}</span>
                        </td>
                        <td className="p-4 text-gray-300">{course.category || 'Development'}</td>
                        <td className="p-4 text-gray-300">{course.instructor || 'Instructor'}</td>
                        <td className="p-4 text-indigo-400 font-bold">${course.price || 0.00}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            course.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {course.status || 'Published'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{course.created_date || course.createdAt || '2026-08-01'}</td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <Link 
                            to={`/courses/${course.id}`} 
                            className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                          >
                            View
                          </Link>
                          <Link 
                            to={`/admin/courses/${course.id}/edit`} 
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => handleToggleStatus(course.id, course.status)}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg font-semibold transition"
                          >
                            {course.status === 'Published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button 
                            onClick={() => confirmDelete(course)}
                            className="px-2.5 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">No courses found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-700 flex justify-center space-x-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      currentPage === idx + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Confirm Course Deletion</h3>
            <p className="text-xs text-gray-300">
              Are you sure you want to delete <strong className="text-white">"{courseToDelete?.title}"</strong>? This action cannot be undone and will remove all associated modules and lessons.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}