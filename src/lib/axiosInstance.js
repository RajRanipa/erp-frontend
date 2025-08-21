// src/lib/axiosInstance.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_Backend_url,
  withCredentials: true, // 🔑 sends cookies to backend
});

let isRefreshing = false;
let failedQueue = [];

let accessTokenExpireAt = null;
let refreshTimeoutId = null;

export const setAccessTokenExpireAt = (timestamp) => {
  try {
    console.log("setAccessTokenExpireAt called with timestamp:", timestamp); // is directly giving us time stamp from login success response because we are saving token in httponly so we can't access it in js
    if (typeof timestamp === 'string') {
      // Assume it's an ISO string
      accessTokenExpireAt = Date.parse(timestamp);
      console.log(
        "accessTokenExpireAt set to:",
        new Date(accessTokenExpireAt).toISOString(),
        `(raw: ${timestamp})`
      );
    } else if (typeof timestamp === 'number') {
      // Assume it's seconds since epoch
      accessTokenExpireAt = timestamp * 1000;
      console.log(
        "accessTokenExpireAt set to:",
        new Date(accessTokenExpireAt).toISOString(),
        `(raw: ${timestamp})`
      );
    } else {
      throw new Error("Invalid timestamp type for setAccessTokenExpireAt");
    }
  } catch (err) {
    console.error("Failed to set accessTokenExpireAt in setAccessTokenExpireAt:", err);
    accessTokenExpireAt = null;
  }
};

export const refreshAccessToken = async () => {
  console.log("refreshAccessToken called");
  try {
    const res = await api.post('/refresh-token', null, { withCredentials: true });
    console.log("Token refresh successful in refreshAccessToken");
    if (res.data?.accessTokenExpireAt) {
      setAccessTokenExpireAt(res.data.accessTokenExpireAt);
      startAccessTokenTimer();
    }
    return res;
  } catch (error) {
    console.error("Token refresh failed in refreshAccessToken:", error);
    throw error;
  }
};

export const startAccessTokenTimer = () => {
  console.log("startAccessTokenTimer called. Current refreshTimeoutId:", refreshTimeoutId);
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    console.log("Cleared existing refresh timeout");
  }
  if (!accessTokenExpireAt) {
    console.log("No accessTokenExpireAt set, exiting startAccessTokenTimer");
    return;
  }
  const now = Date.now();
  const expireTime = accessTokenExpireAt - 5000; // 5 seconds before expiry for testing
  console.log("Calculated expireTime (5 seconds before expiry):", expireTime);
  const delay = expireTime - now;
  console.log(`Token refresh delay calculated: ${delay} ms (${(delay / 1000).toFixed(2)} seconds)`);
  if (delay <= 0) {
    console.log("Delay <= 0, attempting immediate token refresh");
    refreshAccessToken().then(() => {
      console.log("Immediate token refresh successful");
    }).catch(() => {
      console.error("Immediate token refresh failed, redirecting to login");
      window.location.href = '/login';
    });
  } else {
    console.log("Setting timeout to refresh token in", delay, "ms");
    refreshTimeoutId = setTimeout(() => {
      console.log(`Timeout triggered after ${delay} ms, attempting token refresh`);
      refreshAccessToken().catch(() => {
        console.error('Failed to refresh token after timeout, redirecting to login');
        window.location.href = '/login';
      });
    }, delay);
  }
};

const processQueue = (error, token = null) => {
  console.log("Processing failed queue. Number of requests in queue:", failedQueue.length);
  failedQueue.forEach(prom => {
    if (error) {
      console.error("Rejecting queued request due to error:", error);
      prom.reject(error);
    } else {
      console.log("Resolving queued request");
      prom.resolve();
    }
  });

  failedQueue = [];
  console.log("Failed queue cleared");
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("401 error detected, handling token refresh");
      if (isRefreshing) {
        console.log("Token refresh already in progress, queuing request");
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(() => {
          console.log("Retrying original request after token refresh");
          return api(originalRequest);
        }).catch(err => {
          console.error("Error retrying original request after refresh:", err);
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log("Starting token refresh");

      try {
        const res = await refreshAccessToken();
        console.log("Token refresh successful, processing queue");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError);
        console.log("Redirecting to login due to refresh failure");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        console.log("Token refresh process finished");
      }
    }

    console.error("Error response intercepted:", error);
    return Promise.reject(error);
  }
);

export const axiosInstance = api;