// src/lib/axiosInstance.js
import axios from 'axios';

// Central axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_Backend_url,
  withCredentials: true, // sends cookies to backend
});

// Internal state
let isRefreshing = false;
let failedQueue = [];
let refreshTimeoutId = null;
let accessTokenExpireAt = null; // absolute epoch ms when token expires (UTC ms)

// Debug logger (no noise in production)
const dbg = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

// --- Utilities --------------------------------------------------------------
// Normalize expiry provided by server into epoch ms (number)
const parseExpiryToMs = (expiry) => {
  if (!expiry) return null;
  // If a number: treat > 1e12 as ms, otherwise treat as seconds
  if (typeof expiry === 'number') {
    return expiry > 1e12 ? expiry : expiry * 1000;
  }
  // Try parse ISO date string
  const ms = Date.parse(expiry);
  return Number.isNaN(ms) ? null : ms;
};

// Compute delay (ms) until we should refresh: expireAtMs - now - safetyMarginMs
const getDelayMs = (expireAtMs, safetyMarginMs = 60_000) => {
  if (!expireAtMs) return 0;
  const now = Date.now();
  const remaining = expireAtMs - now - safetyMarginMs;
  return remaining > 0 ? remaining : 0;
};

// Emit an auth logout event so application can handle navigation
const emitLogout = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'));
    }
  } catch (err) {
    dbg('emitLogout error', err);
  }
};

// --- Queue helpers ---------------------------------------------------------
const processQueue = (error) => {
  dbg('Processing failed queue. length=', failedQueue.length);
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// --- Token refresh helpers -----------------------------------------------
export const refreshAccessToken = async () => {
  dbg('refreshAccessToken called');
  try {
    const res = await api.post('/refresh-token', null, { withCredentials: true });
    dbg('refresh token response', res?.data);

    // Server should return accessTokenExpireAt (absolute epoch ms) or expiry info
    const expiryFromServer = res?.data?.accessTokenExpireAt ?? res?.data?.expiry ?? null;

    if (expiryFromServer) {
      const parsedExpiry = parseExpiryToMs(expiryFromServer);
      if (parsedExpiry) {
        setAccessTokenExpireAt(parsedExpiry);
      }
    } else {
      // If no expiry info, clear timer to avoid repeated refresh attempts
      setAccessTokenExpireAt(null);
    }

    return res.data;
  } catch (error) {
    dbg('refreshAccessToken failed', error);
    throw error;
  }
};

// Set the absolute expiry (epoch ms) and schedule refresh timer
export const setAccessTokenExpireAt = (expiry) => {
  try {
    const expireAtMs = parseExpiryToMs(expiry);
    dbg('setAccessTokenExpireAt called with:', expiry, expireAtMs);

    if (!expireAtMs) {
      dbg('Invalid expiry, clearing schedule');
      accessTokenExpireAt = null;
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      if (typeof window !== 'undefined') localStorage.removeItem('accessTokenExpireAt');
      return;
    }

    accessTokenExpireAt = expireAtMs;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessTokenExpireAt', String(accessTokenExpireAt));
    }

    // schedule refresh with a safety margin (e.g., 1 minute before expiry)
    const delayMs = getDelayMs(accessTokenExpireAt);
    dbg('Scheduling token refresh in ms:', delayMs);
    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    if (delayMs <= 0) {
      // If already near expiry, attempt immediate refresh
      dbg('Delay <= 0 — attempting immediate refresh');
      refreshAccessToken().catch((err) => {
        dbg('Immediate refresh failed — emitting logout', err);
        emitLogout();
      });
      return;
    }

    refreshTimeoutId = setTimeout(async () => {
      dbg('Refresh timer fired — calling refreshAccessToken');
      try {
        await refreshAccessToken();
      } catch (e) {
        dbg('Scheduled refresh failed — emitting logout', e);
        emitLogout();
      }
    }, delayMs);
  } catch (err) {
    dbg('setAccessTokenExpireAt error', err);
  }
};

// Start timer from stored localStorage value (call on app init)
export const startAccessTokenTimer = () => {
  dbg('startAccessTokenTimer: called');
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('accessTokenExpireAt');
    if (!stored) {
      dbg('startAccessTokenTimer: no stored expiry');
      return;
    }
    const expireAtMs = Number(stored);
    if (!expireAtMs) return;
    accessTokenExpireAt = expireAtMs;

    const delayMs = getDelayMs(accessTokenExpireAt);
    dbg('startAccessTokenTimer scheduling refresh in ms:', delayMs);

    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    if (delayMs <= 0) {
      // immediate refresh
      refreshAccessToken().catch(() => emitLogout());
    } else {
      refreshTimeoutId = setTimeout(() => {
        refreshAccessToken().catch(() => emitLogout());
      }, delayMs);
    }
  } catch (err) {
    dbg('startAccessTokenTimer error', err);
  }
};

// Optional: Refresh on user activity to keep session alive
const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];
let activityTimerId = null;
const activityThrottleMs = 30_000; // throttle refresh attempts to at most once every 30 seconds

const onUserActivity = () => {
  if (activityTimerId) return; // throttle
  activityTimerId = setTimeout(() => {
    activityTimerId = null;
  }, activityThrottleMs);

  if (!accessTokenExpireAt) return;

  const now = Date.now();
  const timeToExpiry = accessTokenExpireAt - now;

  // If token expires soon (less than 2 minutes), refresh now on activity
  if (timeToExpiry > 0 && timeToExpiry < 2 * 60_000) {
    dbg('User activity detected near token expiry, refreshing token');
    refreshAccessToken().catch(() => emitLogout());
  }
};

if (typeof window !== 'undefined') {
  activityEvents.forEach((event) => window.addEventListener(event, onUserActivity));
}

// --- Axios interceptor ----------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if no response or not 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // do not retry if marked
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // queue and refresh logic
    if (isRefreshing) {
      dbg('Refresh in progress — queueing request');
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          dbg('Retrying queued request after refresh');
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      dbg('Attempting token refresh from interceptor');
      await refreshAccessToken();
      processQueue(null);
      dbg('Retrying original request after successful refresh');
      return api(originalRequest);
    } catch (refreshError) {
      dbg('Refresh failed in interceptor — processing queue and logging out', refreshError);
      processQueue(refreshError);
      emitLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const axiosInstance = api;