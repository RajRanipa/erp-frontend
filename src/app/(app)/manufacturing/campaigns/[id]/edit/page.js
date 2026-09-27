'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CampaignForm from '../../../components/CampaignForm';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

export default function EditCampaignPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // return 
        const res = await axiosInstance.get(`/api/campaigns/${id}`);
        setInitial(res.data ?? {});
      } catch (e) {
        Toast.error( 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (values) => {
    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/campaigns/${id}`, values);
      Toast.success('Campaign updated');
      router.push(`/manufacturing/campaigns/${id}`);
    } catch (e) {
      Toast.error( e?.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-semibold">Edit campaign</h1>
        <p className="mb-6 text-sm text-white-500">Update campaign dates, status and operational remarks.</p>
        {loading
          ? <div>Loading…</div>
          : <CampaignForm mode="edit" initialValues={initial} onSubmit={handleUpdate} submitting={submitting} />
        }
      </div>
  );
}
