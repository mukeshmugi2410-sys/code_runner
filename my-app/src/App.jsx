import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages (Make sure these component files are created in your src/pages folder)
import Home from './pages/Home';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
// import CourseCatalog from './pages/CourseCatalog';
 import CoursesPage from './pages/CoursesPage';
 import CourseDetail from './pages/CourseDetail';
 import RoadmapsPage from './pages/RoadmapsPage'; // Adjust the relative path if your files are structured differently
 import LearnLesson from './pages/LearnLesson';
 import RoadmapDetail from './pages/RoadmapDetail';
 import CheckoutPage from './pages/CheckoutPage';
 import MyCoursesPage from './pages/MyCoursesPage';
 import CertificatesPage from './pages/CertificatesPage';
 import ChatbotPage from './pages/ChatbotPage';
 import ProfilePage from './pages/ProfilePage';
 import AdminDashboardPage from './pages/admin/AdminDashboardPage';
 import CourseManagementPage from './pages/admin/CourseManagementPage';
 import AddCoursePage from './pages/admin/AddCoursePage';
 import EditCoursePage from './pages/admin/EditCoursePage';
 import CategoryManagementPage from './pages/admin/CategoryManagementPage';
 import RoadmapManagementPage from './pages/admin/RoadmapManagementPage';
 import AddRoadmapPage from './pages/admin/AddRoadmapPage';
 import EditRoadmapPage from './pages/admin/EditRoadmapPage';
 import RoadmapStagesPage from './pages/admin/RoadmapStagesPage';
 import UsersAdminPage from './pages/admin/UsersAdminPage';
 import EnrollmentsAdminPage from './pages/admin/EnrollmentsAdminPage';
 import PaymentsAdminPage from './pages/admin/PaymentsAdminPage';
 import CourseContentAdminPage from './pages/admin/CourseContentAdminPage';
 import LessonAdminPage from './pages/admin/LessonAdminPage';
 import InstructorsAdminPage from './pages/admin/InstructorsAdminPage';
 

export default function App() {
  return (
    <Router>
      <Routes>
               {/* 1. Home Page */}
        <Route path="/" element={<Home />} />

        {/* 2. Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 4. Student Dashboard */}
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* 5. Courses Catalog Page */}
        <Route path="/courses" element={<CoursesPage />} />

        {/* 6. Course Details Page */}
        <Route path="/courses/:id" element={<CourseDetail />} />

        {/* 7. Learning / Course Player Page */}
        <Route path="/learn/:courseId" element={<LearnLesson />} />

        {/* 8. Roadmaps Page */}
        <Route path="/roadmaps" element={<RoadmapsPage />} />

        {/* 9. Roadmap Details Page */}
        <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
       
        {/* 10. Payment / Checkout Page */}
        <Route path="/checkout/:courseId" element={<CheckoutPage />} />
        
         {/*11. MyCoursesPage*/}
        <Route path="/my-courses" element={<MyCoursesPage />} />

        {/* 12. Certificate Page */}
        <Route path="/certificates" element={<CertificatesPage />} />
        
        {/* 13. AI Chatbot Page */}
        <Route path="/chatbot" element={<ChatbotPage />} />
        {/* 14. User Profile Page */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* 15. Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboardPage />} />

       
        <Route path="/admin/courses" element={<CourseManagementPage />} />

        <Route path="/admin/courses/add" element={<AddCoursePage />} />

        <Route path="/admin/courses/:id/edit" element={<EditCoursePage />} />

        <Route path="/admin/categories" element={<CategoryManagementPage />} />

        <Route path="/admin/roadmaps" element={<RoadmapManagementPage />} />
        <Route path="/admin/roadmaps/add" element={<AddRoadmapPage />} />
        <Route path="/admin/roadmaps/:id/edit" element={<EditRoadmapPage />} />
        <Route path="/admin/roadmaps/:id/stages" element={<RoadmapStagesPage />} />


        <Route path="/admin/users" element={<UsersAdminPage />} />

        <Route path="/admin/enrollments" element={<EnrollmentsAdminPage />} />

        <Route path="/admin/payments" element={<PaymentsAdminPage />} />

        <Route path="/admin/courses/:courseId/content" element={<CourseContentAdminPage />} />
        <Route path="/admin/courses/:courseId/content/:moduleId" element={<LessonAdminPage />} />
        
        <Route path="/admin/instructors" element={<InstructorsAdminPage />} />
        
        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}