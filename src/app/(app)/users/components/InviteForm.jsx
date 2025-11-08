// src/app/(app)/users/components/InviteForm.jsx
'use client';
import React, { useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SubmitButton from '@/Components/buttons/SubmitButton';

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'admin', label: 'Admin' },
  // avoid offering 'owner' here unless you want to
];

export default function InviteForm({ onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return Toast.error('Email is required');
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/api/users/invite', { email, role });
      onInvited?.(res?.data?.data || {});
      setEmail('');
      setRole('staff');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to send invite';
      Toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <CustomInput
        label="Invite by email"
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <SelectTypeInput
        label="Role"
        name="role"
        value={role}
        options={roleOptions}
        onChange={(e) => setRole(e?.target?.value || 'staff')}
      />
      <SubmitButton label="Invite" loading={submitting} disabled={submitting} className='mb-5'/>
    </form>
  );
}