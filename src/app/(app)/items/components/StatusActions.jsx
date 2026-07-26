'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import SelectInput from '@/Components/inputs/SelectInput';

const STATUS_TRANSITIONS = {
  draft: ['pending_approval', 'archived'],
  pending_approval: ['approved', 'rejected', 'archived'],
  rejected: ['draft', 'archived'],
  approved: ['active', 'archived'],
  active: ['archived'],
  archived: ['draft'],
};

const STATUS_COLORS = {
  draft: 'bg-gray-200 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-300 text-gray-600',
};

const labelForStatus = status =>
  String(status || '').replaceAll('_', ' ');

export default function StatusActions({ item, onStatusChange }) {
  const { can } = useAuthz();
  const [status, setStatus] = useState(item?.status || 'draft');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(item?.status || 'draft');
  }, [item?.status]);

  const options = useMemo(
    () => [status, ...(STATUS_TRANSITIONS[status] || [])].map(value => ({
      value,
      label: labelForStatus(value),
    })),
    [status],
  );

  const handleChange = async event => {
    const nextStatus = event.target.value;
    if (!nextStatus || nextStatus === status || loading) return;

    const previousStatus = status;
    setLoading(true);
    try {
      const response = await axiosInstance.patch(`/api/items/${item._id}/status`, {
        to: nextStatus,
        reason: `Status changed from ${previousStatus} to ${nextStatus}`,
      });
      const updated = response.data?.data || response.data?.item || {
        ...item,
        status: nextStatus,
      };
      setStatus(updated.status);
      onStatusChange?.(updated);
      Toast.success(`Status updated to ${labelForStatus(updated.status)}`);
    } catch (error) {
      Toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update Item status',
      );
    } finally {
      setLoading(false);
    }
  };

  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.draft;

  if (!can('items:status:update') || options.length === 1) {
    return (
      <span className={`rounded-2xl px-2 py-0 text-sm font-medium capitalize ${colorClass}`}>
        {labelForStatus(status)}
      </span>
    );
  }

  return (
    <SelectInput
      value={status}
      onChange={handleChange}
      disabled={loading}
      placeholder="Select status"
      className={`rounded-2xl border px-2 py-1 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-action ${colorClass}`}
      parent_className="mb-0"
      options={options}
    />
  );
}
