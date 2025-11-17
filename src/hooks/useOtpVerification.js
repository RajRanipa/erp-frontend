// src/hooks/useOtpVerification.js
import { useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';

/**
 * Generic OTP verification hook.
 *
 * Config:
 *  - endpoint: string (API URL to POST OTP to)
 *  - buildPayload: (otp: string) => object (how to shape request body)
 *  - onVerified?: (data: any) => void (called on success)
 *  - validate?: (otp: string) => string | null | '' (return error message if invalid)
 */
export const useOtpVerification = ({
  endpoint,
  buildPayload,
  onVerified,
  validate,
}) => {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleChange = useCallback(
    (e) => {
      setOtp(e.target.value);
      if (error) setError('');
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');
      setInfo('');

      const trimmed = otp.trim();

      // Custom validation from caller (can use email, phone, etc. via closure)
      if (validate) {
        const validationError = validate(trimmed);
        if (validationError) {
          setError(validationError);
          return;
        }
      } else {
        // Default simple validation
        if (!trimmed) {
          setError('Please enter the OTP.');
          return;
        }
      }

      setSubmitting(true);
      try {
        const payload = buildPayload(trimmed);
        const res = await axiosInstance.post(endpoint, payload);

        setInfo('OTP verified successfully.');

        if (onVerified) {
          onVerified(res?.data || {});
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to verify OTP. Please try again.';
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [otp, endpoint, buildPayload, onVerified, validate]
  );

  const reset = useCallback(() => {
    setOtp('');
    setError('');
    setInfo('');
    setSubmitting(false);
  }, []);

  return {
    otp,
    setOtp,
    submitting,
    error,
    info,
    handleChange,
    handleSubmit,
    reset,
  };
};