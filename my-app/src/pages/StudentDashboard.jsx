import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getAuthMe, 
  getUserCourses, 
  getUserProgress, 
  getUserCertificates, 
  getRoadmaps, 
  getNotifications 
} from '../services/api';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userRes = await getAuthMe();
        const userData = userRes.data.user || userRes.data;
        setUser(userData);
        const userId = userData.id;

        const [
          coursesRes,
          progressRes,
          certsRes,
          roadmapsRes,
          notifRes
        ] = await Promise.all([
          getUserCourses(userId).catch(() => ({ data: [] })),
          getUserProgress(userId).catch(() => ({ data: {} })),
          getUserCertificates(userId).catch(() => ({ data: [] })),
          getRoadmaps().catch(() => ({ data: [] })),
          getNotifications().catch(() => ({ data: [] }))
        ]);

        // Ensure data is parsed safely into arrays/objects
        const rawCourses = coursesRes.data.courses || coursesRes.data;
        setCourses(Array.isArray(rawCourses) ? rawCourses : []);

        setProgress(progressRes.data || {});

        const rawCerts = certsRes.data.certificates || certsRes.data;
        setCertificates(Array.isArray(rawCerts) ? rawCerts : []);

        const rawRoadmaps = roadmapsRes.data.roadmaps || roadmapsRes.data;
        setRoadmaps(Array.isArray(rawRoadmaps) ? rawRoadmaps : []);

        const rawNotifs = notifRes.data.notifications || notifRes.data;
        setNotifications(Array.isArray(rawNotifs) ? rawNotifs : []);

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Student Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col justify-between">
        <div className="p-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
            CODE RUNNER
          </Link>
          <nav className="mt-8 space-y-2 text-sm font-medium">
            <Link to="/dashboard" className="flex items-center space-x-3 bg-indigo-600 text-white px-4 py-2.5 rounded-lg transition">
              <span>Dashboard</span>
            </Link>
            <Link to="/my-courses" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>My Courses</span>
            </Link>
            <Link to="/courses" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>Explore Courses</span>
            </Link>
            <Link to="/roadmaps" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>Roadmaps</span>
            </Link>
            <Link to="/certificates" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>Certificates</span>
            </Link>
            <Link to="/chatbot" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>AI Chatbot</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg transition">
              <span>Profile Settings</span>
            </Link>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-800">
          <button 
            onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            className="w-full text-left text-sm font-medium text-red-400 hover:text-red-300 transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Welcome back, <strong className="text-white">{user?.name || 'Student'}</strong></span>
            <Link to="/profile" className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 1. Welcome Section & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900/40 to-gray-800 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">Student Portal</span>
              <h2 className="text-2xl font-bold text-white mb-2">Keep up the great momentum!</h2>
              <p className="text-gray-300 text-sm max-w-xl">You have active courses in progress and pending modules waiting for your expertise.</p>
            </div>

            {/* Notifications */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <h3 className="font-bold text-white text-sm mb-4">Notifications</h3>
              <div className="space-y-3 max-h-28 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <p key={idx} className="text-xs text-gray-400 border-b border-gray-700/50 pb-2">{n.message || n.title}</p>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No new notifications.</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <span className="text-xs text-gray-400 font-medium">Enrolled Courses</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{courses.length}</h3>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <span className="text-xs text-gray-400 font-medium">Completed Lessons</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{progress?.completed_lessons || 0}</h3>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <span className="text-xs text-gray-400 font-medium">Certificates Earned</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{certificates.length}</h3>
            </div>
          </div>

          {/* 3. Continue Learning / My Courses */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Continue Learning</h3>
              <Link to="/my-courses" className="text-indigo-400 hover:underline text-sm font-medium">View all courses</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1">{course.title}</h4>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-4">{course.description}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">{course.level || 'Beginner'}</span>
                    <Link to={`/learn/${course.id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Resume
                    </Link>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-gray-500 text-sm py-4">No enrolled courses found. Browse the catalog to get started!</div>
              )}
            </div>
          </div>

          {/* 4. Roadmap Progress & Certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Career Roadmap Progress</h3>
              <div className="space-y-4">
                {roadmaps.slice(0, 2).map((rm) => (
                  <div key={rm.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{rm.title}</h4>
                      <span className="text-xs text-gray-400">{rm.level}</span>
                    </div>
                    <Link to={`/roadmaps/${rm.id}`} className="text-xs font-medium text-indigo-400 hover:underline">View Roadmap</Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Earned Certificates</h3>
              <div className="space-y-3">
                {certificates.slice(0, 2).map((cert) => (
                  <div key={cert.id} className="p-3 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{cert.course_name || 'Course Certificate'}</span>
                    <Link to={`/certificates`} className="text-xs text-indigo-400 hover:underline">Download</Link>
                  </div>
                ))}
                {certificates.length === 0 && (
                  <p className="text-xs text-gray-500">Complete courses to unlock certificates.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
    
  );
}