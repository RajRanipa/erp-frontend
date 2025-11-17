// src/app/accept-invite/page.js
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import CustomInput from '@/Components/inputs/CustomInput';
import { Toast } from '@/Components/toast';
import NavLink from '@/Components/NavLink';
import Loading from '@/Components/Loading';
import SubmitButton from '@/Components/buttons/SubmitButton';

function getToken() {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  return u.searchParams.get('token') || '';
}


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const validateEmail = (v) => {
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
};

export default function AcceptInvitePage() {
  const [token] = useState(getToken());
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const validate = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/auth/invite/validate`, { params: { token } });
      setMeta(res?.data || null);
      setName(res?.data?.name || '');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Invalid or expired invite';
      Toast.error(msg);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    validate();
  }, [validate, token]);


  const accept = async (e) => {
    e.preventDefault();
    if (!name || !password) return Toast.error('Name and password are required');
    try {
      setBusy(true);
      await axiosInstance.post('/auth/accept-invite', { token, name, password });
      Toast.success('Account created. Please log in.');
      window.location.href = '/login';
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to accept invite';
      Toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    try {
      setBusy(true);
      await axiosInstance.post('/auth/decline-invite', { token });
      Toast.info('Invitation declined.');
      window.location.href = '/login';
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to decline invite';
      Toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // IMPORTANT: keep validate URL consistent with backend route mount
  // change this:
  // await axiosInstance.get('/api/users/auth/invite/validate', { params: { token } });
  // to this:
  // await axiosInstance.get('/auth/invite/validate', { params: { token } });

  // …inside the return, under the submit button:
  // <button className="btn-primary" type="submit" disabled={busy}>Create Account</button>
  // Add:
  // <button className="btn-ghost mt-2" type="button" onClick={decline} disabled={busy}>Decline invitation</button>

  if (loading) return <div className="p-6"><Loading variant="skeleton" className="h-20" /></div>;

  if (!meta) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Invitation</h1>
        <p className="text-white-500 mb-4">This invite is invalid or expired.</p>
        <NavLink href="/login" type="button">Go to Login</NavLink>
      </div>
    );
  }
  console.log('meta', meta)
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <form onSubmit={accept} className="w-full max-w-md bg-most p-8 shadow-md rounded-lg flex flex-col items-center gap-2">
      <h1 className="text-xl font-semibold mb-2 text-primary-text">Join {meta.companyName || 'the workspace'}</h1>
      <p className="text-white-500 mb-4 text-center text-sm">
        You’re joining as <b>{meta.role}</b> using email <b>{meta.email}</b>.
      </p>

        <CustomInput name={'name'} label="Your name" value={name} onChange={(e)=>setName(e.target.value)} />
        <CustomInput name={'password'} label="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <div className='flex gap-2 w-full items-center justify-between'>
        <SubmitButton type="submit" label='Create Account' loading={busy} />
        <SubmitButton type="button" label='Decline invitation' loading={busy} className="bg-red-800 hover:bg-red-900" onClick={decline}/>
        </div>

      <div className="mt-4 text-sm text-white-500">
        Already have an account? <NavLink href="/login" type="link" className="underline">Log in</NavLink>
      </div>
      </form>
    </div>
  );
}