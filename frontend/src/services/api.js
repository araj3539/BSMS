// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // you can set timeout etc here
});

// request interceptor to add token
api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) { /* ignore */ }
  return config;
}, err => Promise.reject(err));

export default api;
