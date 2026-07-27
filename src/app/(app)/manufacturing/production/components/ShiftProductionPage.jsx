'use client';

import { useEffect, useState } from 'react';
import Loading from '@/Components/Loading';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import {
  apiClient,
  getApiErrorMessage,
} from '@/lib/axiosInstance';
import ProductionTable from './ProductionTable';

const EMPTY_FILTERS = { productType: '' };

export default function ShiftProductionPage({ shift }) {
  const normalizedShift = String(shift || '').trim().toUpperCase();
  const shiftLabel = normalizedShift === 'NIGHT' ? 'Night' : 'Day';
  const endpointShift = shiftLabel.toLowerCase();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [productions, setProductions] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get(`/api/production/${endpointShift}`, {
          signal: controller.signal,
        });
        setProductions(Array.isArray(result.data) ? result.data : []);
      } catch (requestError) {
        if (requestError?.code === 'ERR_CANCELED') return;
        setProductions([]);
        setError(getApiErrorMessage(requestError, `Failed to load ${shiftLabel.toLowerCase()} production.`));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [endpointShift, shiftLabel]);

  const sendReport = async () => {
    setSubmitting(true);
    try {
      const result = await apiClient.post('/api/production/send-report', {
        shift: normalizedShift,
      });
      Toast.success(result.message || `${shiftLabel} production report sent successfully.`);
    } catch (requestError) {
      Toast.error(getApiErrorMessage(requestError, 'Failed to send production report.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{shiftLabel} production</h1>
        <SubmitButton
          label="Send report"
          loading={submitting}
          disabled={submitting}
          className="mb-0"
          onClick={sendReport}
        />
      </div>

      {loading ? (
        <Loading variant="skeleton" className="h-full w-full" />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200" role="alert">
          {error}
        </div>
      ) : (
        <ProductionTable
          rows={productions}
          loading={false}
          error={null}
          filters={EMPTY_FILTERS}
        />
      )}
    </div>
  );
}
