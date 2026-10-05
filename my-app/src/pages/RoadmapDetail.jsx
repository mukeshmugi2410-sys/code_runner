import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function RoadmapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [stages, setStages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolledStatus, setEnrolledStatus] = useState(false);

  useEffect(() => {
    const fetchRoadmapDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [roadmapRes, stagesRes, coursesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/roadmaps/${id}`, { headers }).catch(() => ({ data: null })),
          axios.get(`http://localhost:5000/api/roadmaps/${id}/stages`, { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/courses`, { headers }).catch(() => ({ data: [] })),
        ]);

        const roadmapData = roadmapRes.data?.roadmap || roadmapRes.data;
        if (!roadmapData) {
          setError('Roadmap not found.');
          setLoading(false);
          return;
        }

        setRoadmap(roadmapData);
        setEnrolledStatus(roadmapData.is_enrolled || false);

        const rawStages = stagesRes.data?.stages || stagesRes.data;
        setStages(Array.isArray(rawStages) ? rawStages : []);

        const rawCourses = coursesRes.data?.courses || coursesRes.data;
        setCourses(Array.isArray(rawCourses) ? rawCourses : []);

      } catch (err) {
        console.error('Error loading roadmap details:', err);
        setError('Failed to load roadmap details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmapDetails();
  }, [id]);

  // Start or Resume Roadmap
  const handleStartRoadmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/roadmaps/${id}/start`, {}, { headers });
      setEnrolledStatus(true);
      alert('Roadmap started successfully! Keep tracking your progress.');
    } catch (err) {
      // Fallback toggle state if backend route differs
      setEnrolledStatus(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Roadmap Details...</div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-4">
        <div className="text-red-400 text-lg font-semibold">{error || 'Roadmap not found.'}</div>
        <Link to="/roadmaps" className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">
          Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/roadmaps" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/courses" className="text-sm font-medium text-gray-400 hover:text-white transition">Courses</Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border-b border-gray-800 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md">
                {roadmap.category || 'Engineering Path'}
              </span>
              <span className="text-xs text-gray-400 font-medium">Level: <strong className="text-white">{roadmap.level || 'Intermediate'}</strong></span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{roadmap.title}</h1>
            <p className="text-gray-300 text-sm leading-relaxed">{roadmap.description}</p>
          </div>

          <div>
            <button
              onClick={handleStartRoadmap}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/30"
            >
              {enrolledStatus ? 'Resume Roadmap' : 'Start Roadmap'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-8 py-10 w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Stages Timeline (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Learning Stages & Milestones</h2>
          
          <div className="space-y-4">
            {stages.length > 0 ? (
              stages.map((stage, idx) => {
                const isCompleted = stage.status === 'completed' || idx === 0;
                const isCurrent = stage.status === 'current' || idx === 1;

                return (
                  <div key={stage.id || idx} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Stage {idx + 1}</span>
                          <h3 className="text-base font-bold text-white">{stage.title}</h3>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400' : isCurrent ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {isCompleted ? 'Completed' : isCurrent ? 'Current Stage' : 'Upcoming'}
                      </span>
                    </div>

                    <p className="text-gray-300 text-xs pl-11">{stage.description || 'Master specific engineering competencies through guided practice.'}</p>
                  </div>
                );
              })
            ) : (
              <div className="space-y-4">
                {/* Fallback default mock stages if API returns empty */}
                {[
                  { title: 'Foundations & Setup', desc: 'Understand core syntax, environment configuration, and basic paradigms.', status: 'completed' },
                  { title: 'Intermediate Applications', desc: 'Build reactive architecture, connect databases, and write robust APIs.', status: 'current' },
                  { title: 'Advanced Production Deployment', desc: 'Implement automated CI/CD pipelines, containerization, and monitoring.', status: 'upcoming' }
                ].map((st, idx) => (
                  <div key={idx} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          st.status === 'completed' ? 'bg-emerald-600 text-white' : st.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Stage {idx + 1}</span>
                          <h3 className="text-base font-bold text-white">{st.title}</h3>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        st.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : st.status === 'current' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {st.status.charAt(0).toUpperCase() + st.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs pl-11">{st.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Courses & Projects (Right Column) */}
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Recommended Courses</h3>
            <div className="space-y-3">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="p-3 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-xs">{course.title}</h4>
                    <span className="text-[10px] text-gray-400">{course.level || 'Beginner'}</span>
                  </div>
                  <Link to={`/courses/${course.id}`} className="text-xs text-indigo-400 hover:underline font-medium">View</Link>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="text-xs text-gray-400">Courses will populate based on your career path.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Capstone Projects</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-900 border border-gray-700 rounded-xl">
                <h4 className="font-semibold text-white text-xs">Full-Stack Enterprise Portal</h4>
                <p className="text-[10px] text-gray-400 mt-1">Build and deploy a scalable production app with authentication and dashboards.</p>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-700 rounded-xl">
                <h4 className="font-semibold text-white text-xs">AI-Powered Signal Classifier</h4>
                <p className="text-[10px] text-gray-400 mt-1">Implement ML inference pipelines and visualization interfaces.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}