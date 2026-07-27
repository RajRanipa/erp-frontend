'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPartySummary } from '../lib/partyApi';

export function usePartySummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await apiPartySummary({ signal: controller.signal });
      setData(response?.data || null);
    } catch (requestError) {
      if (
        !controller.signal.aborted
        && requestError?.name !== 'AbortError'
        && requestError?.code !== 'ERR_CANCELED'
      ) {
        setError(requestError);
      }
    } finally {
      if (abortRef.current === controller && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  return { data, loading, error, refetch };
}
