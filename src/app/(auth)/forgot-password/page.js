'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import NavLink from '@/Components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('email');
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const start = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/auth/password-reset/start', { email: form.email });
      setMessage(response?.data?.message || 'If the account exists, a code was sent.');
      setStep('reset');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/password-reset/complete', {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      router.replace(`/login?email=${encodeURIComponent(form.email)}&reset=success`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md rounded-xl bg-most p-8 shadow-md">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mb-6 mt-1 text-sm text-white-500">
          Verification codes expire after 10 minutes and allow five attempts.
        </p>
        {error && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
        {message && <div className="mb-4 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-400">{message}</div>}
        {step === 'email' ? (
          <form onSubmit={start}>
            <CustomInput
              label="Account email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
              required
            />
            <SubmitButton className="w-full" loading={loading}>Send reset code</SubmitButton>
          </form>
        ) : (
          <form onSubmit={complete}>
            <CustomInput
              label="Verification code"
              value={form.otp}
              onChange={(event) => setForm((value) => ({ ...value, otp: event.target.value }))}
              required
            />
            <CustomInput
              label="New password"
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm((value) => ({ ...value, newPassword: event.target.value }))}
              info="At least 10 characters with uppercase, lowercase, and a number."
              required
            />
            <CustomInput
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((value) => ({ ...value, confirmPassword: event.target.value }))}
              required
            />
            <SubmitButton className="w-full" loading={loading}>Reset password</SubmitButton>
          </form>
        )}
        <div className="mt-5 text-center text-sm">
          <NavLink href="/login" type="link">Back to login</NavLink>
        </div>
      </div>
    </div>
  );
}
