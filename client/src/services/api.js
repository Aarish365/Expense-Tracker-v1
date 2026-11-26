import axios from 'axios';

// VITE_API_URL is set in client/.env (see client/.env.example)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT token to every request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arthflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Show the server's error message and handle expired sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('arthflow_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
