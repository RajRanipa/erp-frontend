'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/axiosInstance';

export default function useApiRequest({ initialData = null } = {}) {
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const [state, setState] = useState({
    data: initialData,
    error: null,
    loading: false,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (config = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await apiRequest({ ...config, signal: config.signal || controller.signal });
      if (mountedRef.current) {
        setState({ data: result.data, error: null, loading: false });
      }
      return result;
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      const normalized = {
        cause: error,
        message: getApiErrorMessage(error),
        code: error?.api?.error?.code || error?.response?.data?.code || 'REQUEST_ERROR',
        requestId: error?.api?.requestId || error?.response?.data?.requestId || null,
      };
      if (mountedRef.current) {
        setState((current) => ({ ...current, error: normalized, loading: false }));
      }
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ data: initialData, error: null, loading: false });
  }, [initialData]);

  return { ...state, execute, reset };
}
