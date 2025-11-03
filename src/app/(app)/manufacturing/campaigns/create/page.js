'use client';
import React, { useState } from 'react';
import CampaignForm from '../../components/CampaignForm';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';
import Manufacturing from '../../page';

export default function StartManufacturing() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (values) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/api/campaigns', values);
      toast({ type: 'success', message: res?.data?.message || 'Campaign created', duration: 4000, autoClose: true, placement: 'top-center', animation: 'top-bottom' });
      // optional: router.push('/manufacturing'); or reset via key in parent if needed
    } catch (err) {
      toast({ type: 'error', message: err?.response?.data?.message || 'Failed to create campaign', duration: 4000, autoClose: true, placement: 'top-center', animation: 'top-bottom' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Manufacturing>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-6 capitalize">Start New Manufacturing campaigns</h1>
        <CampaignForm mode="create" onSubmit={handleCreate} submitting={submitting} />
      </div>
    </Manufacturing>
  );
}