// src/app/crm/parties/hooks/useParty.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

export function useParty(id) {
  
  const [data, setData] = useState(null), [loading, setLoading] = useState(false);
  const fetchOne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/parties/${id}`);
      setData(res.data.data);
    } catch (e) {
      Toast.error( e?.response?.data?.message || 'Failed to load party');
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { fetchOne(); }, [fetchOne]);
  return { data, loading, refetch: fetchOne };
}