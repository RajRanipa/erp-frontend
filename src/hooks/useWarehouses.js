// src/app/hook/useWarehouses.js

'use client';
import { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';

export function useWarehouses({ minimal = true } = {}) {
  const [state, setState] = useState({ loading: true, list: [], error: null });

  const fetchWarehouses = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const params = new URLSearchParams();
      if (minimal) params.set('select', '_id,name');
      params.set('limit', '100'); // or smaller
      const res = await axiosInstance.get(`/api/warehouses?${params.toString()}`);
      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.warehouses)
        ? res.data.warehouses
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setState({ loading: false, list: data, error: null });
    } catch (err) {
      setState({ loading: false, list: [], error: err });
    }
  }, [minimal]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  return { ...state, refresh: fetchWarehouses };
}