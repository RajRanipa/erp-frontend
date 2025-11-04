// src/app/components/items/StatusActions.jsx
'use client';
import React, { useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hook/useAuthz';
import SelectInput from '@/Components/inputs/SelectInput';

const STATUS_OPTIONS = [
  'not assigned',
  'draft',
  'pending_approval',
  'rejected',
  'approved',
  'active',
  'archived',
];

export default function StatusActions({ item, onStatusChange }) {
  const { can } = useAuthz();
  
  const [status, setStatus] = useState(item?.status || 'not_assigned');
  // console.log('item', item);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === status) return;

    setLoading(true);
    try {
      // const res = await axiosInstance.patch(`/items/${item._id}/status`, {
      //   to: newStatus,
      //   reason: `Status changed from ${status} to ${newStatus}`,
      // });
      const payload = {
        status: newStatus,
        reason: `Status changed from ${status} to ${newStatus}`,
      };
      const res = await axiosInstance.put(`/api/items/${item._id}`, payload);
      const updated = res.data?.item || { ...item, status: newStatus };
      setStatus(updated.status);
      onStatusChange?.(updated);
      Toast.success(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update status', err);
      Toast.error(err?.response?.data?.message || err.message || 'Failed to update item status');
    } finally {
      setLoading(false);
    }
  };

  const colorClass = {
    not_assigned: 'bg-white-200 text-white-800',
    draft: 'bg-gray-200 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-300 text-gray-600',
  }[status] || 'bg-gray-200 text-gray-700';

  return (
    <div className="flex items-center gap-2">
      {status && !can('items:status:update') && <span
        className={`text-sm font-medium px-2 py-0 rounded-2xl ${colorClass}`}
      >
        {status.replace('_', ' ')}
      </span>}
{/* <SelectInput
            key={`status-${resetKey}`}
            name="status"
            options={statusOptions}
            value={formData.status}
            onChange={(v) => handleChange('status', v)}
            onBlur={() => handleBlur('status')}
            required
            placeholder="Status"
            label="Status"
            err={touched.status ? errors.status : ''}
          /> */}
           {/* {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select> */}
      {status && can('items:status:update') && (
        
        <SelectInput
          value={status}
          onChange={handleChange}
          disabled={loading}
          placeholder="Select Status"
          className={`text-sm border rounded-2xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-action ${colorClass}`}
          parent_className="mb-0"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
        />

      )}
    </div>
  );
}