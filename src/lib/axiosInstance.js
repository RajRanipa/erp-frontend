// src/lib/axiosInstance.js
import axios from 'axios';

// console.log("process.env.NEXT_PUBLIC_BACKEND_PORT", process.env.NEXT_PUBLIC_BACKEND_PORT);
// Central axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_PORT,
  withCredentials: true,
});
const refreshApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_PORT,
  withCredentials: true,
});

// Internal state
let isRefreshing = false;
let failedQueue = [];
let refreshTimeoutId = null;
let accessTokenExpireAt = null; // absolute epoch ms when token expires (UTC ms)
let activeRequestCount = 0;

const API_ACTIVITY_EVENT = 'api:activity';

const isApiEnvelope = (value) =>
  Boolean(
    value
    && typeof value === 'object'
    && typeof value.success === 'boolean'
    && Object.prototype.hasOwnProperty.call(value, 'data')
    && value.apiVersion
  );

const emitApiActivity = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(API_ACTIVITY_EVENT, {
    detail: { count: activeRequestCount, active: activeRequestCount > 0 },
  }));
};

const beginApiActivity = (config = {}) => {
  if (config.skipGlobalLoading || config._activityStarted) return config;
  config._activityStarted = true;
  activeRequestCount += 1;
  emitApiActivity();
  return config;
};

const endApiActivity = (config = {}) => {
  if (!config._activityStarted) return;
  config._activityStarted = false;
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  emitApiActivity();
};

const createRequestId = () => {
  try {
    return globalThis.crypto?.randomUUID?.();
  } catch {
    return null;
  }
};

const legacyPayloadFromEnvelope = (envelope) => {
  if (!envelope.success) {
    const details = envelope.error?.details ?? null;
    return {
      success: false,
      status: false,
      statusCode: envelope.statusCode,
      status_code: envelope.statusCode,
      message: envelope.message,
      code: envelope.error?.code || 'REQUEST_ERROR',
      details,
      errors: details,
      error: envelope.error,
      requestId: envelope.requestId,
    };
  }

  const data = envelope.data;
  if (Array.isArray(data)) {
    // Arrays remain arrays for legacy list screens, while `.data` also works for
    // newer screens that previously consumed `{ data: [...] }`.
    const metaProperties = Object.fromEntries(
      Object.entries(envelope.meta || {})
        .filter(([key]) => !['data', 'length'].includes(key))
        .map(([key, value]) => [key, { value, configurable: true }])
    );
    Object.defineProperties(data, {
      data: { value: data, configurable: true },
      success: { value: true, configurable: true },
      status: { value: true, configurable: true },
      message: { value: envelope.message, configurable: true },
      meta: { value: envelope.meta, configurable: true },
      ...metaProperties,
    });
    return data;
  }

  if (data && typeof data === 'object') {
    return {
      ...data,
      ...(envelope.meta || {}),
      success: true,
      status: true,
      statusCode: envelope.statusCode,
      message: envelope.message,
      data,
      meta: envelope.meta,
      requestId: envelope.requestId,
    };
  }

  return {
    success: true,
    status: true,
    statusCode: envelope.statusCode,
    message: envelope.message,
    data,
    meta: envelope.meta,
    requestId: envelope.requestId,
  };
};

const normalizeAxiosResponse = (response) => {
  endApiActivity(response?.config);
  if (!isApiEnvelope(response?.data)) return response;

  response.api = response.data;
  response.data = legacyPayloadFromEnvelope(response.api);
  return response;
};

const normalizeAxiosError = (error) => {
  endApiActivity(error?.config);
  if (isApiEnvelope(error?.response?.data)) {
    error.api = error.response.data;
    error.response.data = legacyPayloadFromEnvelope(error.api);
  }
  return error;
};

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
    const res = await refreshApi.post('/auth/refresh-token', null, { withCredentials: true });
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
    // dbg('setAccessTokenExpireAt called with:', expiry, expireAtMs);

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

export const clearAccessTokenTimer = () => {
  accessTokenExpireAt = null;
  if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
  refreshTimeoutId = null;
  if (typeof window !== 'undefined') localStorage.removeItem('accessTokenExpireAt');
};

// Start timer from stored localStorage value (call on app init)
export const startAccessTokenTimer = () => {
  // dbg('startAccessTokenTimer: called');
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('accessTokenExpireAt');
    if (!stored) {
      // dbg('startAccessTokenTimer: no stored expiry');
      return;
    }
    const expireAtMs = Number(stored);
    if (!expireAtMs) return;
    accessTokenExpireAt = expireAtMs;

    const delayMs = getDelayMs(accessTokenExpireAt);
    // dbg('startAccessTokenTimer scheduling refresh in ms:', delayMs);

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

api.interceptors.request.use((config) => {
  const requestId = createRequestId();
  if (requestId && !config.headers?.['X-Request-ID']) {
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = requestId;
  }
  return beginApiActivity(config);
});

refreshApi.interceptors.response.use(
  normalizeAxiosResponse,
  (error) => Promise.reject(normalizeAxiosError(error))
);

// --- Axios interceptor ----------------------------------------------------
api.interceptors.response.use(
  normalizeAxiosResponse,
  async (error) => {
    normalizeAxiosError(error);
    const originalRequest = error.config;

    // if no response or not 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (String(originalRequest?.url || '').includes('/auth/refresh-token')) {
      emitLogout();
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

export const getActiveRequestCount = () => activeRequestCount;

export const getApiEnvelope = (responseOrError) =>
  responseOrError?.api
  || responseOrError?.response?.api
  || (isApiEnvelope(responseOrError?.data) ? responseOrError.data : null)
  || null;

export const getApiData = (response, fallback = null) => {
  const envelope = getApiEnvelope(response);
  if (envelope) return envelope.data ?? fallback;
  return response?.data?.data ?? response?.data ?? fallback;
};

export const getApiMessage = (response, fallback = '') =>
  getApiEnvelope(response)?.message
  || response?.data?.message
  || fallback;

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  getApiEnvelope(error)?.message
  || error?.response?.data?.message
  || (error?.code === 'ERR_CANCELED' ? 'Request cancelled.' : '')
  || (error?.request && !error?.response ? 'Unable to connect to the server. Check your connection.' : '')
  || fallback;

export const getApiErrorDetails = (error) =>
  getApiEnvelope(error)?.error?.details
  ?? error?.response?.data?.details
  ?? error?.response?.data?.errors
  ?? null;

export const apiRequest = async (config) => {
  const response = await api(config);
  const envelope = getApiEnvelope(response);
  return {
    data: envelope?.data ?? response?.data?.data ?? response?.data ?? null,
    message: envelope?.message ?? response?.data?.message ?? null,
    meta: envelope?.meta ?? response?.data?.meta ?? null,
    statusCode: envelope?.statusCode ?? response.status,
    requestId: envelope?.requestId ?? response.headers?.['x-request-id'] ?? null,
    response,
  };
};

export const apiClient = {
  get: (url, config) => apiRequest({ ...config, method: 'get', url }),
  delete: (url, config) => apiRequest({ ...config, method: 'delete', url }),
  post: (url, data, config) => apiRequest({ ...config, method: 'post', url, data }),
  put: (url, data, config) => apiRequest({ ...config, method: 'put', url, data }),
  patch: (url, data, config) => apiRequest({ ...config, method: 'patch', url, data }),
};

export const axiosInstance = api;
