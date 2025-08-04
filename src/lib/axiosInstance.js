import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_Backend_url,
  withCredentials: true, // 🔑 sends cookies to backend
});

// ⏰ Request interceptor (Optional: attach accessToken if using headers)
// api.interceptors.request.use(...)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("interceptors fire ! ")
    // ⛔ If token expired AND not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("error.config :- ",error.config)
      try {
        // 🔄 Hit refresh-token endpoint
        await api.post('/refresh-token');

        // 🔁 Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed", refreshError);
        // Optional: redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const axiosInstance = api;