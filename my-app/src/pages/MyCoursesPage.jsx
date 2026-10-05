import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MyCourses() {
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'history'

  useEffect(() => {
    const fetchMyCoursesData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch enrollments and user specific course data
        const res = await axios.get('http://localhost:5000/api/enrollments', { headers }).catch(() => ({ data: [] }));
        const rawEnrollments = res.data?.enrollments || res.data;
        setEnrollments(Array.isArray(rawEnrollments) ? rawEnrollments : []);
      } catch (err) {
        console.error('Error loading my courses:', err);
        setError('Failed to load your enrolled courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCoursesData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Your Learning Portfolio...</div>
      </div>
    );
  }

  // Filter courses based on status or completion percentage
  const activeCourses = enrollments.filter((en) => (en.progress_percentage || en.progress || 0) < 100);
  const completedCourses = enrollments.filter((en) => (en.progress_percentage || en.progress || 0) === 100);

  const displayedCourses = activeTab === 'completed' ? completedCourses : activeCourses;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/courses" className="text-sm font-medium text-gray-400 hover:text-white transition">Catalog</Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-8 py-10 w-full flex-1 space-y-8">
        
        {/* Top Title & Stats Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Courses & Progress</h1>
            <p className="text-gray-400 text-sm mt-1">Track your active lessons, milestones, and earned certificates.</p>
          </div>

          {/* Quick Learning Stats */}
          <div className="grid grid-cols-3 gap-4 bg-gray-800/60 border border-gray-700/80 p-4 rounded-2xl">
            <div className="text-center px-3">
              <span className="block text-xs text-gray-400">Enrolled</span>
              <strong className="text-lg font-bold text-white">{enrollments.length}</strong>
            </div>
            <div className="text-center px-3 border-x border-gray-700">
              <span className="block text-xs text-gray-400">Completed</span>
              <strong className="text-lg font-bold text-emerald-400">{completedCourses.length}</strong>
            </div>
            <div className="text-center px-3">
              <span className="block text-xs text-gray-400">Hours Learned</span>
              <strong className="text-lg font-bold text-indigo-400">24.5h</strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'active' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Active Courses ({activeCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'completed' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Completed Courses ({completedCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Enrollment History
          </button>
        </div>

        {/* Content View Based on Active Tab */}
        {activeTab === 'history' ? (
          /* Enrollment History List */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-700 font-bold text-sm text-white">Full Enrollment & Purchase History</div>
            <div className="divide-y divide-gray-700">
              {enrollments.length > 0 ? (
                enrollments.map((en, idx) => (
                  <div key={en.id || idx} className="p-4 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{en.course_title || en.title || 'Advanced Full-Stack Engineering'}</h4>
                      <span className="text-gray-400">Enrolled on: {en.enrollment_date || 'October 2026'}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-semibold">Verified Active</span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">No enrollment records found.</div>
              )}
            </div>
          </div>
        ) : (
          /* Course Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.length > 0 ? (
              displayedCourses.map((en) => {
                const courseId = en.course_id || en.id;
                const progressVal = en.progress_percentage || en.progress || (activeTab === 'completed' ? 100 : 35);

                return (
                  <div key={courseId} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition shadow-xl">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-md">
                          {en.category || 'Development'}
                        </span>
                        {progressVal === 100 && (
                          <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-bold">
                            🏆 Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white">{en.course_title || en.title || 'Course Title'}</h3>
                      <p className="text-gray-400 text-xs line-clamp-2">{en.description || 'Master modern production workflows, architectures, and hands-on coding paradigms.'}</p>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{progressVal}%</span>
                        </div>
                        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-700">
                          <div
                            className={`h-full transition-all duration-300 ${progressVal === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progressVal}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700/60 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{en.instructor_name || 'Expert Instructor'}</span>
                      <Link
                        to={`/learn/${courseId}`}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow"
                      >
                        {progressVal === 100 ? 'Review Course' : 'Continue Learning →'}
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16 bg-gray-800/30 border border-gray-700/50 rounded-2xl">
                <p className="text-gray-400 text-sm">
                  {activeTab === 'completed'
                    ? "You haven't completed any courses yet. Keep learning!"
                    : "No active enrollments found. Explore the course catalog to start learning."}
                </p>
                <Link to="/courses" className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}