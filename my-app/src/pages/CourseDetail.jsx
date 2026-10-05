import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive features state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch course details, modules, reviews, and progress concurrently
        const [courseRes, modulesRes, reviewsRes, progressRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses/${id}`, { headers }).catch(() => ({ data: null })),
          axios.get(`http://localhost:5000/api/courses/${id}/modules`, { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/courses/${id}/reviews`, { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/courses/${id}/progress`, { headers }).catch(() => ({ data: null })),
        ]);

        const courseData = courseRes.data?.course || courseRes.data;
        if (!courseData) {
          setError('Course not found.');
          setLoading(false);
          return;
        }

        setCourse(courseData);

        const rawModules = modulesRes.data?.modules || modulesRes.data;
        setModules(Array.isArray(rawModules) ? rawModules : []);

        const rawReviews = reviewsRes.data?.reviews || reviewsRes.data;
        setReviews(Array.isArray(rawReviews) ? rawReviews : []);

        setProgress(progressRes.data || null);

      } catch (err) {
        console.error('Error loading course details:', err);
        setError('Failed to load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  // Handle Coupon Validation
  const handleValidateCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/coupons/validate', {
        code: couponCode,
        course_id: id
      });
      const discountValue = res.data.discount_percentage || res.data.discount || 10;
      setDiscount(discountValue);
      setCouponMessage(`Coupon applied! ${discountValue}% off.`);
    } catch (err) {
      setCouponError('Invalid or expired coupon code.');
      setDiscount(0);
    }
  };

  // Handle Wishlist Toggle
  const handleToggleWishlist = async () => {
    try {
      await axios.post('http://localhost:5000/api/wishlist', { course_id: id });
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      // Fallback toggle state if backend route isn't configured yet
      setIsWishlisted(!isWishlisted);
    }
  };

  // Handle Free Enrollment or Paid Checkout
  const handleEnrollOrBuy = async () => {
    const finalPrice = course.price > 0 ? course.price * (1 - discount / 100) : 0;
    if (finalPrice > 0) {
      navigate(`/checkout/${id}`, { state: { course, finalPrice } });
    } else {
      try {
        setEnrolling(true);
        await axios.post('http://localhost:5000/api/enrollments', { course_id: id });
        alert('Successfully enrolled in the course!');
        navigate(`/learn/${id}`);
      } catch (err) {
        alert('Enrollment failed. Please ensure you are logged in.');
      } finally {
        setEnrolling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Course Details...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-4">
        <div className="text-red-400 text-lg font-semibold">{error || 'Course not found.'}</div>
        <Link to="/courses" className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const calculatedPrice = course.price > 0 ? (course.price * (1 - discount / 100)).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/courses" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/my-courses" className="text-sm font-medium text-gray-400 hover:text-white transition">My Courses</Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border-b border-gray-800 py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md">
              {course.category || 'Development'}
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white">{course.title}</h1>
            <p className="text-gray-300 text-sm leading-relaxed">{course.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2">
              <span>Instructor: <strong className="text-white">{course.instructor_name || 'Expert Instructor'}</strong></span>
              <span>•</span>
              <span>Level: <strong className="text-white">{course.level || 'Beginner'}</strong></span>
              <span>•</span>
              <span>Rating: <strong className="text-white">⭐ {course.rating || '4.8'} ({reviews.length} reviews)</strong></span>
            </div>
          </div>

          {/* Pricing & Enrollment Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
            {/* Thumbnail */}
            <div className="h-40 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-400 font-bold text-sm">Course Thumbnail</span>
              )}
            </div>

            {/* Price section */}
            <div>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-white">
                  {course.price > 0 ? `$${calculatedPrice}` : 'Free'}
                </span>
                {discount > 0 && (
                  <span className="text-sm text-gray-500 line-through">${course.price}</span>
                )}
              </div>
              {course.price > 0 && discount > 0 && (
                <span className="text-xs text-emerald-400 mt-1 block">Coupon {discount}% discount applied!</span>
              )}
            </div>

            {/* Coupon input form */}
            {course.price > 0 && (
              <form onSubmit={handleValidateCoupon} className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition">
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                {couponMessage && <p className="text-xs text-emerald-400">{couponMessage}</p>}
              </form>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleEnrollOrBuy}
                disabled={enrolling}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {course.price > 0 ? 'Buy Now / Checkout' : 'Enroll Now for Free'}
              </button>
              
              <button
                onClick={handleToggleWishlist}
                className="w-full bg-gray-900 border border-gray-700 hover:border-indigo-500 text-gray-300 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
              >
                <span>{isWishlisted ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Body Section */}
      <div className="max-w-7xl mx-auto px-8 py-10 w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Learning Objectives */}
          <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">What You Will Learn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
              {(course.objectives || [
                'Master core concepts from beginner to advanced level',
                'Build real-world production-ready web applications',
                'Implement secure authentication and database integration',
                'Deploy applications efficiently to production environments'
              ]).map((obj, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-indigo-400 font-bold">✓</span>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Syllabus / Modules */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Course Syllabus</h3>
            <div className="space-y-3">
              {modules.length > 0 ? (
                modules.map((mod, idx) => (
                  <div key={mod.id || idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-indigo-400 font-semibold">Module {idx + 1}</span>
                      <h4 className="font-bold text-white text-sm">{mod.title}</h4>
                      <p className="text-gray-400 text-xs mt-0.5">{mod.description || 'Comprehensive module lessons and practical coding exercises.'}</p>
                    </div>
                    <span className="text-xs text-gray-500">{mod.lessons_count || 4} lessons</span>
                  </div>
                ))
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-400 text-xs">
                  Modules syllabus is structured into comprehensive weekly milestones.
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">Requirements</h3>
            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1.5 pl-2">
              {(course.requirements || [
                'Basic familiarity with computers and modern web browsers',
                'No prior programming experience required for beginner tracks'
              ]).map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Student Reviews</h3>
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-white text-xs">{rev.user_name || 'Verified Student'}</strong>
                      <span className="text-xs text-amber-400">⭐ {rev.rating || 5}</span>
                    </div>
                    <p className="text-gray-300 text-xs">{rev.comment || 'Amazing course! Very practical and well explained.'}</p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-400 text-xs">
                  No reviews yet. Be the first to review this course after enrolling!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Instructor Info */}
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Instructor Profile</h3>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                {course.instructor_name ? course.instructor_name.charAt(0) : 'E'}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{course.instructor_name || 'Lead Instructor'}</h4>
                <p className="text-xs text-gray-400">Senior Full-Stack Engineer & Educator</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {course.instructor_bio || 'Passionate software architect with years of industry experience building scalable enterprise web applications and teaching aspiring developers.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}