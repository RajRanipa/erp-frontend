

// src/app/(app)/parties/hooks/useParty.js
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetParty } from '../lib/partyApi';

/**
 * useParty
 * - Fetches a single party by id
 * - Handles abort + loading + error
 *
 * Expected backend response:
 *   { status: true, data: Party }
 */
export function useParty(partyId, options = { enabled: true }) {
  const { enabled = true } = options || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchNow = useCallback(async () => {
    if (!partyId || !enabled) return;

    // cancel previous request
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const res = await apiGetParty(partyId, { signal: ctrl.signal });

      if (!mountedRef.current) return;

      setData(res?.data || null);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
      setError(e);
      setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [partyId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (enabled) fetchNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchNow,
  };
}

export default useParty;