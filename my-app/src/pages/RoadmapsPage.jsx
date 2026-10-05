import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get('http://localhost:5000/api/roadmaps', { headers }).catch(() => ({ data: [] }));
        const rawRoadmaps = res.data?.roadmaps || res.data;
        setRoadmaps(Array.isArray(rawRoadmaps) ? rawRoadmaps : []);
      } catch (err) {
        console.error('Error loading roadmaps:', err);
        setError('Failed to load career roadmaps.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  // Filter roadmaps logic
  const filteredRoadmaps = roadmaps.filter((rm) => {
    const matchesSearch = rm.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rm.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rm.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || rm.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Career Roadmaps...</div>
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
          <Link to="/courses" className="text-sm font-medium text-gray-400 hover:text-white transition">Courses</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1 space-y-8">
        {/* Title and Search Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Career Roadmaps</h1>
            <p className="text-gray-400 text-sm mt-1">Structured learning paths designed to guide you from beginner to professional.</p>
          </div>
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search roadmaps by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/50 border border-gray-700/60 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Full-Stack">Full-Stack Development</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="DevOps">DevOps & Cloud</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Roadmap Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map((rm) => (
            <div key={rm.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition shadow-lg">
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-md">
                    {rm.category || 'Engineering'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {rm.level || 'Beginner'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{rm.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-3">{rm.description}</p>
                
                {/* Skill Categories / Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(rm.skills || ['Python', 'React', 'Database', 'API']).map((skill, sIdx) => (
                    <span key={sIdx} className="text-[10px] bg-gray-900 border border-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-900/40 border-t border-gray-700/60 flex items-center justify-between">
                <span className="text-xs text-gray-400">{rm.modules_count || 6} milestones</span>
                <Link to={`/roadmaps/${rm.id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                  Start Roadmap
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredRoadmaps.length === 0 && (
          <div className="text-center py-16 bg-gray-800/30 border border-gray-700/50 rounded-2xl">
            <p className="text-gray-400 text-sm">No career roadmaps match your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}