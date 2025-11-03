// src/app/crm/parties/hooks/useParty.js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';

export function useParty(id) {
  const toast = useToast();
  const [data, setData] = useState(null), [loading, setLoading] = useState(false);
  const fetchOne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/parties/${id}`);
      setData(res.data.data);
    } catch (e) {
      toast({ type: 'error', message: e?.response?.data?.message || 'Failed to load party' });
    } finally { setLoading(false); }
  }, [id, toast]);
  useEffect(() => { fetchOne(); }, [fetchOne]);
  return { data, loading, refetch: fetchOne };
}