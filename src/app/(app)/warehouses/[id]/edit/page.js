'use client';
// src/app/warehouse/[id]/edit/page.js
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WarehouseForm from '../../components/warehouseForm';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Warehouse from '../../page';

export default function EditWarehousePage() {
  const { id } = useParams();
  const router = useRouter();
  

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
        if (!mounted) return;
        if (!data) {
          Toast.error('Warehouse not found');
          router.push('/warehouses');
          return;
        }
        setInitial(data);
      } catch (err) {
        if (!mounted) return;
        Toast.error(err?.response?.data?.message || 'Failed to load warehouse');
        router.push('/warehouses');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, router]);

  const handleSuccess = () => {
    Toast.success('Warehouse saved');
    router.push('/warehouses');
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
