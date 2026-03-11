
import axios from 'axios';
import config from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('access_token');
      // Force a full page reload to redirect to login
      // This is a simple and effective way to clear all state and redirect
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
