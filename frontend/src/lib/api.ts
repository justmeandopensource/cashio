
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import config from '@/config';

// --- Token storage ---

let cachedToken: string | null = null;
let cachedRefreshToken: string | null = null;

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

export const setRefreshToken = (token: string | null) => {
  cachedRefreshToken = token;
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

export const getRefreshToken = (): string | null => {
  if (cachedRefreshToken === null) {
    cachedRefreshToken = localStorage.getItem('refresh_token');
  }
  return cachedRefreshToken;
};

// Navigation callback for 401 redirects — set by the app shell
let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorized = callback;
};

const forceLogout = () => {
  setAuthToken(null);
  setRefreshToken(null);
  if (onUnauthorized) {
    onUnauthorized();
  } else {
    window.location.href = '/login';
  }
};

// --- Axios instance ---

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

// --- Silent refresh with concurrent request queuing ---

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((pending) => {
    if (error) {
      pending.reject(error);
    } else {
      pending.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor — attempts silent refresh on 401 before giving up
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401s, not on the refresh endpoint itself, and only once per request
    const isRefreshRequest = originalRequest?.url?.includes('/user/refresh');
    if (error.response?.status !== 401 || isRefreshRequest || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // If another refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      processQueue(error);
      forceLogout();
      return Promise.reject(error);
    }

    try {
      // Use a plain axios call (not the `api` instance) to avoid interceptor loops
      const response = await axios.post(`${config.apiBaseUrl}/user/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      setAuthToken(access_token);
      setRefreshToken(newRefreshToken);

      processQueue(null, access_token);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
