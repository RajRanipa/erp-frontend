// src/app/crm/parties/hooks/useParties.js
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

export function useParties({ role, status, q, page, limit }) {
  
  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/parties', { params: { role, status, q, page, limit } });
      setData({ rows: res.data.data || [], total: res.data.total || 0 });
    } catch (e) {
      Toast.error(e?.response?.data?.message || 'Failed to load parties');
    } finally { setLoading(false); }
  }, [role, status, q, page, limit]);

  useEffect(() => { fetchList(); }, [fetchList]);
  return { ...data, loading, refetch: fetchList };
}