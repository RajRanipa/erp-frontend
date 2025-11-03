// src/app/crm/parties/hooks/useSaveParty.js
'use client';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

export function useSaveParty() {
  
  const create = async (payload) => {
    try {
      const r = await axiosInstance.post('/api/parties', payload);
      Toast.success('Party created');
      return r.data.data;
    } catch (error) {
      console.error(error);
      Toast.error( error.response?.data?.message || error.message || 'Something went wrong');
      throw error;
    }
  };
  const update = async (id, payload) => {
    try {
      const r = await axiosInstance.put(`/api/parties/${id}`, payload);
      Toast.success('Party updated');
      return r.data.data;
    } catch (error) {
      console.error(error);
      Toast.error( error.response?.data?.message || error.message || 'Something went wrong');
      throw error;
    }
  };
  const patchStatus = async (id, status) => {
    try {
      const r = await axiosInstance.patch(`/api/parties/${id}/status`, { status });
      Toast.success('Status updated');
      return r.data.data;
    } catch (error) {
      console.error(error);
      Toast.error( error.response?.data?.message || error.message || 'Something went wrong');
      throw error;
    }
  };
  return { create, update, patchStatus };
}