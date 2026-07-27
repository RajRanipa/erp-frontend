// src/app/hook/useWarehouses.js

'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiClient, getApiErrorMessage } from '@/lib/axiosInstance';

export function useWarehouses({ minimal = true } = {}) {
  const [state, setState] = useState({ loading: true, list: [], error: null });

  const fetchWarehouses = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const params = new URLSearchParams();
      if (minimal) params.set('select', '_id,name');
      params.set('limit', '100'); // or smaller
      const result = await apiClient.get(`/api/warehouses?${params.toString()}`);
      const data = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.warehouses)
        ? result.data.warehouses
        : [];
      setState({ loading: false, list: data, error: null });
    } catch (err) {
      setState({
        loading: false,
        list: [],
        error: { cause: err, message: getApiErrorMessage(err, 'Failed to load warehouses.') },
      });
    }
  }, [minimal]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  return { ...state, refresh: fetchWarehouses };
}
