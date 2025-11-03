'use client';
// src/app/warehouse/[id]/edit/page.js
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WarehouseForm from '../../components/warehouseForm';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';
import Warehouse from '../../page';

export default function EditWarehousePage() {
  const { id } = useParams();
  console.log(id);
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/warehouses/${id}`);
        const data = res?.data?.data ?? res?.data ?? null;
        console.log('data', data);
        if (!mounted) return;
        if (!data) {
          toast({ type: 'error', message: 'Warehouse not found' });
          router.push('/warehouse');
          return;
        }
        setInitial(data);
      } catch (err) {
        if (!mounted) return;
        toast({ type: 'error', message: err?.response?.data?.message || 'Failed to load warehouse' });
        router.push('/warehouse');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleSuccess = (saved) => {
    toast({ type: 'success', message: 'Warehouse saved' });
    router.push('/warehouse');
  };

  return (
    <Warehouse>
      <h1 className="text-2xl font-semibold mb-6">Edit Warehouse</h1>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <WarehouseForm initial={initial} onSuccess={handleSuccess} />
      )}
    </Warehouse>
  );
}