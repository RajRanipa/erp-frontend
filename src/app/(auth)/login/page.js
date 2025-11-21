'use client';

import { useState, useEffect } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance, setAccessTokenExpireAt } from '@/lib/axiosInstance';
import { useUser } from '@/context/UserContext';
import { useCheckAuth } from '@/utils/checkAuth';
import SubmitButton from '@/Components/buttons/SubmitButton';
import EmailVerify from '@/Components/email-verify/EmailVerify';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const validateEmail = (v) => {
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
};

const LoginContent = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const { setUserContext } = useUser();
  const { checkAuth } = useCheckAuth();

  // authMode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');
  // otpStep (only used when authMode === 'otp'): 'email' | 'otp'
  const [otpStep, setOtpStep] = useState('email');

  // Prefill email from query param (e.g. redirected from signup)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const emailFromQuery = params.get('email');
      if (emailFromQuery) {
        setForm((prev) => ({ ...prev, email: emailFromQuery }));
      }
    } catch (err) {
      console.error('Error parsing email from query params:', err);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setEmailError(validateEmail(value));
      if (error) setError('');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const emailErr = validateEmail(form.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    if (!form.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', form, { withCredentials: true });
      console.log('Login success response:', res.data);

      if (res.data.accessTokenExpireAt) {
        setAccessTokenExpireAt(res.data.accessTokenExpireAt);
      }

      if (res.data.status) {
        // Update global context with user info
        checkAuth(setUserContext);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 for OTP login: send OTP to email
  const handleOtpStart = async (e) => {
    e.preventDefault();
    setError('');
    const emailErr = validateEmail(form.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axiosInstance.post(
        '/login/start-otp',
        { email: form.email },
        { withCredentials: true }
      );

      if (!res?.data?.status) {
        throw new Error(res?.data?.message || 'Failed to start OTP login');
      }

      setOtpStep('otp');
    } catch (err) {
      console.error('Start OTP login error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to start OTP login');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLoginSuccess = () => {
    // Backend has already set cookies; just hydrate user context
    checkAuth(setUserContext);
  };

  const switchToMode = (mode) => {
    setAuthMode(mode);
    setError('');
    if (mode === 'otp') {
      setOtpStep('email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-most p-8 shadow-md rounded-lg flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-center text-primary-text">Login</h2>

        {/* Mode toggle */}
        <div className="w-full flex rounded-full bg-secondary/30 p-1 mb-2">
          <button
            type="button"
            onClick={() => switchToMode('password')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition ${
              authMode === 'password'
                ? 'bg-action text-white shadow-sm'
                : 'text-secondary-text hover:bg-secondary/40'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => switchToMode('otp')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition ${
              authMode === 'otp'
                ? 'bg-action text-white shadow-sm'
                : 'text-secondary-text hover:bg-secondary/40'
            }`}
          >
            Login with OTP
          </button>
        </div>

        {error && <p className="text-error text-sm mt-1 w-full text-center">{error}</p>}

        {/* PASSWORD LOGIN MODE */}
        {authMode === 'password' && (
          <form
            onSubmit={handlePasswordSubmit}
            className="w-full flex flex-col items-center gap-2 mt-2"
          >
            <CustomInput
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              err={emailError}
            />

            <div className="relative w-full">
              <CustomInput
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <SubmitButton
              type="submit"
              className="btn-primary w-full my-3"
              loading={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </SubmitButton>
          </form>
        )}

        {/* OTP LOGIN MODE */}
        {authMode === 'otp' && (
          <div className="w-full mt-2">
            {otpStep === 'email' && (
              <form
                onSubmit={handleOtpStart}
                className="w-full flex flex-col items-center gap-3"
              >
                <CustomInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  err={emailError}
                />

                <SubmitButton
                  type="submit"
                  className="btn-primary w-full my-1"
                  loading={otpLoading}
                >
                  {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                </SubmitButton>

                <p className="text-xs text-secondary-text text-center">
                  We&apos;ll send a one-time code to this email. Use it to log in without a password.
                </p>
              </form>
            )}

            {otpStep === 'otp' && (
              <div className="mt-2">
                <EmailVerify
                  mode="login"
                  email={form.email}
                  onSuccess={handleOtpLoginSuccess}
                />
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-secondary-text mt-4">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-action hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginContent;