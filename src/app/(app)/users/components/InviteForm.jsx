'use client';

import React, { useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SubmitButton from '@/Components/buttons/SubmitButton';
import RoleSelect from '@/Components/role/RoleSelect';
import { useUser } from '@/context/UserContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function InviteForm({ onInvited }) {
  const currentUser = useUser();
  const [form, setForm] = useState({ inviteeName: '', email: '', roleId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!EMAIL_RE.test(form.email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (!form.roleId) {
      Toast.error('Select a role for this member.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/api/users/invite', {
        email: form.email.trim(),
        name: form.inviteeName.trim(),
        roleId: form.roleId,
      });
      onInvited?.(response?.data?.data);
      setForm({ inviteeName: '', email: '', roleId: '' });
      setEmailError('');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-white-100 bg-white-50 p-4">
      <div className="mb-4">
        <h2 className="font-semibold">Invite a team member</h2>
        <p className="text-sm text-white-500">
          Their role controls company access. Higher-authority roles cannot be assigned by lower roles.
        </p>
      </div>
      <div className="grid items-end gap-3 md:grid-cols-[1fr_1.2fr_1fr_auto]">
        <CustomInput
          label="Name"
          type="text"
          placeholder="Optional display name"
          value={form.inviteeName}
          onChange={(event) => setForm((value) => ({ ...value, inviteeName: event.target.value }))}
        />
        <CustomInput
          label="Email"
          type="email"
          placeholder="person@company.com"
          value={form.email}
          onChange={(event) => {
            const email = event.target.value;
            setForm((value) => ({ ...value, email }));
            setEmailError(email && !EMAIL_RE.test(email) ? 'Enter a valid email address.' : '');
          }}
          err={emailError}
          required
        />
        <RoleSelect
          label="Company role"
          value={form.roleId}
          onChange={(event) => setForm((value) => ({ ...value, roleId: event.target.value }))}
          excludeOwner={!currentUser.isOwner}
          maxRank={currentUser.isOwner ? undefined : currentUser.roleRank}
          required
        />
        <SubmitButton
          label="Send invitation"
          loading={submitting}
          disabled={submitting || !form.email || !form.roleId || Boolean(emailError)}
          className="mb-5 whitespace-nowrap"
        />
      </div>
    </form>
  );
}
