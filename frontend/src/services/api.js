// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request Interceptor (Keep this - it attaches the token)
api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) { /* ignore */ }
  return config;
}, err => Promise.reject(err));

// --- NEW: Response Interceptor (Handle Expiry) ---
api.interceptors.response.use(
  (response) => response, // Return successful responses as is
  (error) => {
    // Check if error is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Logging out...");
      
      // 1. Clear Local Storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 2. Force Redirect to Login (if not already there)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error); // Pass error to component for specific handling (e.g. showing a toast)
  }
);

export default api;