// src/app/crm/parties/hooks/useSaveParty.js
'use client';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';

export function useSaveParty() {
  const toast = useToast();
  const create = async (payload) => {
    try {
      const r = await axiosInstance.post('/api/parties', payload);
      toast({ type: 'success', message: 'Party created' });
      return r.data.data;
    } catch (error) {
      console.error(error);
      toast({ type: 'error', message: error.response?.data?.message || error.message || 'Something went wrong' });
      throw error;
    }
  };
  const update = async (id, payload) => {
    try {
      const r = await axiosInstance.put(`/api/parties/${id}`, payload);
      toast({ type: 'success', message: 'Party updated' });
      return r.data.data;
    } catch (error) {
      console.error(error);
      toast({ type: 'error', message: error.response?.data?.message || error.message || 'Something went wrong' });
      throw error;
    }
  };
  const patchStatus = async (id, status) => {
    try {
      const r = await axiosInstance.patch(`/api/parties/${id}/status`, { status });
      toast({ type: 'success', message: 'Status updated' });
      return r.data.data;
    } catch (error) {
      console.error(error);
      toast({ type: 'error', message: error.response?.data?.message || error.message || 'Something went wrong' });
      throw error;
    }
  };
  return { create, update, patchStatus };
}