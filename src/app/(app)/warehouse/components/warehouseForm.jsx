// src/app/warehouse/components/warehouseForm.jsx
'use client';
// src/app/warehouse/components/warehouseForm.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';
import CustomInput from '@/components/inputs/CustomInput';
import TextArea from '@/components/inputs/TextArea';

export default function WarehouseForm({ initial = null, onSuccess = null }) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    code: '',
    name: '',
    address: '',
    pincode: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm((f) => ({ ...f, ...initial }));
    }
  }, [initial]);

  const updateField = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const validate = () => {
    if (!form.code || !String(form.code).trim()) return 'Code is required';
    if (!form.name || !String(form.name).trim()) return 'Name is required';
    if (form.pincode && !/^[0-9]{4,6}$/.test(String(form.pincode).trim())) return 'Pincode must be 4–6 digits';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast({ type: 'error', message: err });

    setLoading(true);
    try {
      const payload = {
        code: String(form.code).trim(),
        name: String(form.name).trim(),
        address: form.address ? String(form.address).trim() : undefined,
        pincode: form.pincode ? String(form.pincode).trim() : undefined,
        state: form.state ? String(form.state).trim() : undefined,
      };

      let res;
      if (initial && initial._id) {
        res = await axiosInstance.put(`/api/warehouses/${initial._id}`, payload);
        toast({ type: 'success', message: 'Warehouse updated' });
      } else {
        res = await axiosInstance.post('/api/warehouses', payload);
        console.log('res warehouse', res);
        toast({ type: 'success', message: 'Warehouse created' });
      }

      if (typeof onSuccess === 'function') onSuccess(res?.data?.data || res?.data);
      else router.back();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Operation failed';
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-most-secondary p-4 rounded">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <CustomInput
            type="text"
            name="code"
            label="Code"
            placeholder="e.g. MAIN"
            value={form.code}
            onChange={updateField('code')}
            required
          />
        </div>

        <div>
          <CustomInput
            type="text"
            name="name"
            label="Name"
            placeholder="e.g. Main Warehouse"
            value={form.name}
            onChange={updateField('name')}
            required
          />
        </div>

        <div className="md:col-span-2">
          <TextArea
            name="address"
            label="Address"
            placeholder="Full address"
            value={form.address}
            onChange={updateField('address')}
            className="mt-1 input h-24"
          />
        </div>

        <div>
          <CustomInput
            type="text"
            name="pincode"
            label="Pincode"
            placeholder="e.g. 380001"
            value={form.pincode}
            onChange={updateField('pincode')}
          />
        </div>

        <div>
          <CustomInput
            type="text"
            name="state"
            label="State"
            placeholder="e.g. Gujarat"
            value={form.state}
            onChange={updateField('state')}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Saving…' : initial && initial._id ? 'Update Warehouse' : 'Create Warehouse'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn bg-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}