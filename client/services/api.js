import axios from 'axios';

const api = axios.create({
  // Vite proxies this path to the backend during development.  Set VITE_API_URL
  // when the frontend and API are deployed to separate domains.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, // fail loudly after 15s instead of hanging forever
});

// Runs before EVERY request — attaches the token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
