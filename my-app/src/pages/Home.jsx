import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getCourses, 
  getCategories, 
  getRoadmaps, 
  getPopularCourses, 
  getFeaturedCourses 
} from '../services/api';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [
          coursesRes, 
          categoriesRes, 
          roadmapsRes, 
          popularRes, 
          featuredRes
        ] = await Promise.all([
          getCourses(),
          getCategories(),
          getRoadmaps(),
          getPopularCourses(),
          getFeaturedCourses()
        ]);

        setCourses(coursesRes.data.courses || coursesRes.data || []);
        setCategories(categoriesRes.data.categories || categoriesRes.data || []);
        setRoadmaps(roadmapsRes.data.roadmaps || roadmapsRes.data || []);
        setPopularCourses(popularRes.data.courses || popularRes.data || []);
        setFeaturedCourses(featuredRes.data.courses || featuredRes.data || []);
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/courses?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Code Runner...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-wider text-indigo-500">CODE RUNNER</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/courses" className="hover:text-indigo-400 transition">Courses</Link>
            <Link to="/roadmaps" className="hover:text-indigo-400 transition">Roadmaps</Link>
            <Link to="/chatbot" className="hover:text-indigo-400 transition">AI Chatbot</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium hover:text-indigo-400 transition">Login</Link>
            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Get Started</Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Master Full-Stack & ML with <span className="text-indigo-500">Code Runner</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10">
            Interactive courses, hands-on coding practice, structured career roadmaps, and intelligent AI guidance to supercharge your tech career.
          </p>
          
          {/* 3. Course Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center bg-gray-800 border border-gray-700 rounded-xl p-2 shadow-2xl">
            <input 
              type="text" 
              placeholder="Search for courses, tech stack, or skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-2 text-white focus:outline-none placeholder-gray-500 text-sm"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 5. Featured Courses */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Featured Courses</h2>
          <Link to="/courses" className="text-indigo-400 hover:underline text-sm font-medium">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.slice(0, 3).map((course) => (
            <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500 transition duration-300">
              <div className="h-40 bg-gray-700 flex items-center justify-center text-gray-500">
                {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" /> : 'Course Thumbnail'}
              </div>
              <div className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{course.level}</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">{course.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">${course.price || 'Free'}</span>
                  <Link to={`/courses/${course.id}`} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Popular Courses */}
      <section className="py-16 bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-8">Most Popular Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCourses.slice(0, 4).map((course) => (
              <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1">{course.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-4">{course.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-sm font-semibold text-indigo-400">${course.price || 'Free'}</span>
                  <Link to={`/courses/${course.id}`} className="text-sm text-indigo-400 hover:underline">Details &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-8">Explore Top Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-gray-800 border border-gray-700 hover:border-indigo-500 p-6 rounded-xl text-center cursor-pointer transition">
              <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Roadmaps */}
      <section className="py-16 bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Career Roadmaps</h2>
            <Link to="/roadmaps" className="text-indigo-400 hover:underline text-sm font-medium">View all roadmaps</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {roadmaps.slice(0, 3).map((roadmap) => (
              <div key={roadmap.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{roadmap.level}</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">{roadmap.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{roadmap.description}</p>
                <Link to={`/roadmaps/${roadmap.id}`} className="text-sm font-medium text-indigo-400 hover:underline">
                  View Roadmap &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Testimonials */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-4">Loved by Developers</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-12 text-sm">See how Code Runner has transformed careers and accelerated full-stack & AI engineering skills.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
            <p className="text-gray-300 text-sm mb-4">"The coding environment and roadmaps made learning full-stack development completely seamless."</p>
            <h4 className="font-bold text-white text-sm">Alex Rivera</h4>
            <span className="text-xs text-gray-500">Full-Stack Developer</span>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
            <p className="text-gray-300 text-sm mb-4">"The signal classification and PyTorch implementations matched exactly what I needed for practical ML work."</p>
            <h4 className="font-bold text-white text-sm">Marcus Chen</h4>
            <span className="text-xs text-gray-500">Machine Learning Engineer</span>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
            <p className="text-gray-300 text-sm mb-4">"Fantastic platform architecture. Clean layouts, straightforward API integrations, and brilliant AI chat support."</p>
            <h4 className="font-bold text-white text-sm">Sarah Jenkins</h4>
            <span className="text-xs text-gray-500">Software Engineer</span>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-16 bg-gray-800/50 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-white text-sm">How do I start learning?</summary>
              <p className="text-gray-400 text-sm mt-2">Simply create an account, browse our course catalog or career roadmaps, and enroll in your preferred stack.</p>
            </details>
            <details className="bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-white text-sm">Are certificates provided upon completion?</summary>
              <p className="text-gray-400 text-sm mt-2">Yes! Once you complete all lessons, quizzes, and assignments in a course, a verifiable certificate is generated automatically.</p>
            </details>
            <details className="bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-white text-sm">Can I use the interactive code editor?</summary>
              <p className="text-gray-400 text-sm mt-2">Absolutely. Our coding playground and practice lessons support direct code execution and test case verification.</p>
            </details>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Code Runner Learning Hub. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}