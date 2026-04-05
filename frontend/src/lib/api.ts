
import axios from 'axios';
import config from '@/config';

// In-memory token cache to avoid reading localStorage on every request
let cachedToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  cachedToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAuthToken = (): string | null => {
  if (cachedToken === null) {
    cachedToken = localStorage.getItem('access_token');
  }
  return cachedToken;
};

// Navigation callback for 401 redirects — set by the app shell
let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorized = callback;
};

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
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
      setAuthToken(null);
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
