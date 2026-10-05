import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust to your Flask backend URL if different
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCourses = () => API.get('/courses');
export const getCategories = () => API.get('/categories');
export const getRoadmaps = () => API.get('/roadmaps');
export const getPopularCourses = () => API.get('/courses/popular');
export const getFeaturedCourses = () => API.get('/courses/featured');
// Add these exports to your existing api.js file
export const getAuthMe = () => API.get('/auth/me');
export const getUserCourses = (userId) => API.get(`/users/${userId}/courses`);
export const getUserProgress = (userId) => API.get(`/users/${userId}/progress`);
export const getUserCertificates = (userId) => API.get(`/users/${userId}/certificates`);
export const getNotifications = () => API.get('/notifications');

export default API;