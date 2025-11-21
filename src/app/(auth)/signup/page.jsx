'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import EmailVerify from '@/Components/email-verify/EmailVerify';
import { cn } from '@/utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const validateEmail = (v) => {
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
};

const Signup = () => {
  const router = useRouter();

  // step: 'email' | 'otp' | 'details'
  const [step, setStep] = useState('email');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [emailErr, setEmailErr] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, email: value }));
    setEmailErr(validateEmail(value));
    if (error) setError('');
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // STEP 1: Email submit (check in DB + send OTP if new)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    const emailError = validateEmail(form.email);
    if (emailError) {
      setEmailErr(emailError);
      return;
    }

    setLoading(true);
    try {
      /**
       * Expected backend behaviour for /auth/signup/start (example):
       *  - Check if email exists in DB
       *  - If exists -> return { status: true, data: { exists: true } }
       *  - If not exists -> create signup session + send OTP and return { status: true, data: { exists: false } }
       *
       * Adjust endpoint/response shape as per your backend.
       */
      const res = await axiosInstance.post(
        '/auth/signup/start',
        { email: form.email },
        { withCredentials: true }
      );

      const data = res?.data || {};

      if (!data.status) {
        throw new Error(data.message || 'Unable to start signup. Please try again.');
      }

      // If email already exists -> redirect to login (with email prefilled)
      if (data?.data?.exists) {
        router.push(`/login?email=${encodeURIComponent(form.email)}`);
        return;
      }

      // New email -> move to OTP verification step
      setStep('otp');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start signup. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Final account creation after OTP is verified
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!form.fullName?.trim()) {
      setError('Full name is required');
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError('Password and confirm password are required');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      // Backend /signup should assume email is already verified by OTP step
      const res = await axiosInstance.post('/auth/signup', form, { withCredentials: true });
      const data = res.data;

      if (!data.status) {
        throw new Error(data.message || 'Signup failed');
      }

      // After successful signup, redirect to login
      router.push('/login');
    } catch (err) {
      let message =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong while creating your account.';

      // Optional: extract validation errors array from backend
      if (Array.isArray(err?.response?.data?.details)) {
        message = err.response.data.details.map((e) => e.message).join(', ');
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    // OTP success -> move to password & details step
    setStep('details');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 ">
      <div className="w-full max-w-md bg-most p-8 shadow-md rounded-lg flex flex-col items-center justify-start gap-4 fade-screen">
        <h2 className="text-2xl font-bold text-center text-secondary-text mb-2">
          Create Account
        </h2>

        {/* Global error (for any step) */}
        {error && (
          <p className="text-error text-sm mb-2 text-center w-full">{error}</p>
        )}

        {/* Animated step container */}
        <div className="relative w-full min-h-fit transition-all duration-300 ease-in-out">
          {/* STEP 1: Email */}
          <div
            className={`inset-0 transition-all duration-300 ease-in-out ${step === 'email'
                ? 'opacity-100 -translate-x-0 relative'
                : 'opacity-0 -translate-x-full pointer-events-none absolute'
              }`}
          >
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col items-stretch gap-4 w-full"
            >
              <CustomInput
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleEmailChange}
                required
                err={emailErr}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>

              <p className="text-xs text-white-700 mt-2 text-center">
                We&apos;ll check if this email already has an account and send you an
                OTP if it&apos;s new.
              </p>
            </form>
          </div>

          {/* STEP 2: OTP verification */}
          <div
            className={`inset-0 transition-all duration-300 ease-in-out ${step === 'otp'
                ? 'opacity-100 translate-x-0 relative'
                : 'opacity-0 translate-x-full pointer-events-none absolute'
              }`}
          >
            {step === 'otp' && (
              <div className="flex flex-col gap-4">
                <EmailVerify
                  mode="signup"
                  email={form.email}
                  onSuccess={handleOtpVerified}
                />
              </div>
            )}
          </div>

          {/* STEP 3: Details + Password */}
          <div
            className={`inset-0 transition-all duration-300 ease-in-out ${step === 'details'
                ? 'opacity-100 translate-x-0 relative'
                : 'opacity-0 translate-x-full pointer-events-none absolute'
              }`}
          >
            {step === 'details' && (
              <form
                onSubmit={handleSignupSubmit}
                className="flex flex-col items-stretch gap-4 w-full"
              >
                <CustomInput
                  label="Full Name"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleDetailsChange}
                  required
                />

                <CustomInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleDetailsChange}
                  required
                />

                <CustomInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleDetailsChange}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={cn('mt-4 text-sm w-full flex items-center gap-2', `${step !== 'email' ? 'justify-between' : 'justify-center'}`)}>
          {step !== 'email' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
                className="mr-2 text-action hover:underline"
              >
                Change email
              </button>
              {/* <span className="mx-1 text-white-500">·</span> */}
            </>
          )}
          <p className={" text-center text-secondary-text "}>
            Already have an account?{' '}
            <span
              className="text-action hover:underline cursor-pointer"
              onClick={() => router.push('/login')}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;