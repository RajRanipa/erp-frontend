'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CampaignForm from '../../components/CampaignForm';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

export default function StartManufacturing() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (values) => {
    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/api/campaigns', values);
      Toast.success(res?.data?.message || 'Campaign created', {duration: 4000, autoClose: true, placement: 'top-center', animation: 'top-bottom' });
      const campaignId = res?.data?._id || res?.data?.data?._id;
      router.push(campaignId ? `/manufacturing/campaigns/${campaignId}` : '/manufacturing/campaigns');
    } catch (err) {
      Toast.error( err?.response?.data?.message || 'Failed to create campaign', {duration: 4000, autoClose: true, placement: 'top-center', animation: 'top-bottom' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-semibold">Start manufacturing campaign</h1>
        <p className="mb-6 text-sm text-white-500">Create the campaign that will receive PLC and manual fallback production records.</p>
        <CampaignForm mode="create" onSubmit={handleCreate} submitting={submitting} />
      </div>
  );
}
