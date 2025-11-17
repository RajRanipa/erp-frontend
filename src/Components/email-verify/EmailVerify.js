// src/Components/email-verify/EmailVerify.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import { useOtpVerification } from '@/hooks/useOtpVerification';
import { axiosInstance } from '@/lib/axiosInstance';
import SubmitButton from '../buttons/SubmitButton';

const EmailVerify = ({ mode = 'signup', email, onSuccess }) => {
  const router = useRouter();

  const isLoginMode = mode === 'login';

  const title = isLoginMode ? 'Login with OTP' : 'Verify your email';
  const description = isLoginMode
    ? 'Enter the OTP sent to your email to complete login.'
    : 'Enter the OTP sent to your email to verify your account.';

  const verifyEndpoint = isLoginMode
    ? '/login/verify-otp'
    : '/signup/verify-otp';

  const resendEndpoint = isLoginMode
    ? '/login/resend-otp'
    : '/signup/resend-otp';

  const {
    otp,
    error,
    setError,
    info,
    setInfo,
    submitting,
    handleChange,
    handleSubmit,
    reset,
  } = useOtpVerification({
    endpoint: verifyEndpoint,
    buildPayload: (otpValue) => ({
      email,
      otp: otpValue.trim(),
    }),
    validate: (otpValue) => {
      if (!email) return 'Email is missing. Please go back and try again.';
      if (!otpValue) return 'Please enter the OTP.';
      return '';
    },
    onVerified: (data) => {
      if (onSuccess) {
        onSuccess(data);
      } else {
        if (isLoginMode) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }
    },
  });

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!resendCooldown) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!email) {
      setError('Email is missing. Please go back and try again.');
      return;
    }

    setResendLoading(true);
    setError('');
    setInfo('');
    reset();

    try {
      await axiosInstance.post(
        resendEndpoint,
        { email },
        { withCredentials: true }
      );
      setInfo('A new OTP has been sent to your email.');
      setResendCooldown(30);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to resend OTP. Please try again.';
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-fit items-center justify-center w-full">
      <div className="w-full max-w-md rounded-lg border-0">
        <h2 className="text-base font-semibold text-primary-text mb-1">{title}</h2>
        <p className="text-sm text-white-400 mb-3">{description}</p>

        {email && (
          <p className="mb-4 text-xs text-white-500">
            Email:{' '}
            <span className="font-medium text-white-800 break-all">
              {email}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomInput
            id="otp"
            type="text"
            label="OTP"
            value={otp}
            onChange={handleChange}
            placeholder="Enter OTP"
            required
            err={error}
          />

          {/* {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
              {error}
            </div>
          )} */}

          {info && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 border border-emerald-100">
              {info}
            </div>
          )}

          {/* <button
            type="submit"
            disabled={submitting}
            className={`btn-primary w-full py-2 text-sm font-medium ${
              submitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {submitting
              ? 'Verifying...'
              : isLoginMode
              ? 'Login'
              : 'Verify Email'}
          </button> */}
          <SubmitButton
                    type="submit"
                    className="btn-primary w-full my-3"
                    loading={submitting}
                    disabled={submitting}
                  >
                    {submitting
              ? 'Verifying...'
              : isLoginMode
              ? 'Login'
              : 'Verify Email'}
                  </SubmitButton>
        </form>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            disabled={resendLoading || resendCooldown > 0}
            onClick={handleResend}
            className="text-xs text-action hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : resendLoading
              ? 'Resending...'
              : 'Resend OTP'}
          </button>

          {!isLoginMode && (
            <span className="text-[11px] text-white-500">
              Didn&apos;t get the code? Check spam folder.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerify;