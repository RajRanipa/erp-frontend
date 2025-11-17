'use client';
import React, { useState, useMemo } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SubmitButton from '@/Components/buttons/SubmitButton';
import RoleSelect from '@/Components/role/RoleSelect';
// import RoleSelect from './RoleSelect';


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const validateEmail = (v) => {
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
};

export default function InviteForm({ onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const onEmailChange = (e) => {
    const val = e?.target?.value;
    setEmail(val);
    setEmailError(validateEmail(val));
  };

  const submit = async (e) => {
    e.preventDefault();
    const immediateErr = validateEmail(email);
    if (immediateErr) {
      setEmailError(immediateErr);
      return Toast.error(immediateErr);
    }
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/api/users/invite', { email, role, name: userName });
      onInvited?.(res?.data?.data || {});
      setEmail('');
      setUserName('');
      setRole('');
      setEmailError('');
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
        label="Name"
        type="text"
        placeholder="Enter name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <CustomInput
        label="Invite by email"
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={onEmailChange}
        err={emailError}
        onBlur={() => { emailError ? setEmail('') : null }}
      />
      {/* <SelectTypeInput
        label="Role"
        name="role"
        value={role}
        options={roleOptions}
        onChange={(e) => setRole(e?.target?.value || 'staff')}
      /> */}
      <RoleSelect
        label="Role"
        value={role}
        onChange={(e) => setRole(e?.target?.value)}
        placeholder="Pick or create a role…"
      />
      <SubmitButton label="Invite" loading={submitting} disabled={submitting || !!emailError || !email} className='mb-5' />
    </form>
  );
}