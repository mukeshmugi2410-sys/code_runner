import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCategories } from '../services/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);
        const [coursesRes, categoriesRes] = await Promise.all([
          getCourses().catch(() => ({ data: [] })),
          getCategories().catch(() => ({ data: [] }))
        ]);

        const rawCourses = coursesRes.data.courses || coursesRes.data;
        setCourses(Array.isArray(rawCourses) ? rawCourses : []);

        const rawCategories = categoriesRes.data.categories || categoriesRes.data;
        setCategories(Array.isArray(rawCategories) ? rawCategories : []);
      } catch (err) {
        console.error('Error loading courses catalog:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  // Filter and Sorting Logic
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    
    const isFree = course.price === 0 || course.is_free;
    const matchesPrice = selectedPrice === 'All' || 
                         (selectedPrice === 'Free' && isFree) || 
                         (selectedPrice === 'Paid' && !isFree);
                         
    const matchesRating = selectedRating === 'All' || (course.rating || 0) >= parseFloat(selectedRating);

    return matchesSearch && matchesCategory && matchesLevel && matchesPrice && matchesRating;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0); // Newest default
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Course Catalog...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/my-courses" className="text-sm font-medium text-gray-400 hover:text-white transition">My Courses</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1 space-y-8">
        {/* Title & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Explore Courses</h1>
            <p className="text-gray-400 text-sm mt-1">Discover expert-led courses to accelerate your developer career.</p>
          </div>
          {/* Search Bar */}
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search courses by keyword..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Filters and Sorting Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 bg-gray-800/50 border border-gray-700/60 p-4 rounded-xl">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name || cat}>{cat.name || cat}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Price</label>
            <select
              value={selectedPrice}
              onChange={(e) => { setSelectedPrice(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Prices</option>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Min Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => { setSelectedRating(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Any Rating</option>
              <option value="4.5">4.5 & up</option>
              <option value="4.0">4.0 & up</option>
              <option value="3.5">3.5 & up</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest Additions</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-md">
                    {course.category || 'General'}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-3 mb-4">{course.description}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Level: <strong className="text-white">{course.level || 'Beginner'}</strong></span>
                  <span>•</span>
                  <span>Rating: <strong className="text-white">⭐ {course.rating || '4.8'}</strong></span>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-900/40 border-t border-gray-700/60 flex items-center justify-between">
                <span className="text-xs text-gray-400">{course.lessons_count || 12} lessons</span>
                <Link to={`/courses/${course.id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16 bg-gray-800/30 border border-gray-700/50 rounded-2xl">
            <p className="text-gray-400 text-sm">No courses match your active filter criteria.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-xs font-medium rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-xs font-medium rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}