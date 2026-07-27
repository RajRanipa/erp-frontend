

// src/app/(app)/parties/hooks/useParties.js
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiListParties } from '../lib/partyApi';

function stableKey(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch {
    return String(Date.now());
  }
}

/**
 * useParties
 * - Fetches party list from backend
 * - Returns rows + total + loading + error + refetch
 *
 * Expected backend response:
 *   { status: true, data: Party[], meta: { total } }
 */
export function useParties(params) {
  const key = useMemo(() => stableKey(params), [params]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchNow = useCallback(async () => {
    // Cancel any previous request
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
      const res = await apiListParties(params || {}, { signal: ctrl.signal });

      // In case this hook unmounted
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.data) ? res.data : [];
      const tot = Number(res?.meta?.total || list.length || 0);

      setRows(list);
      setTotal(tot);
      setMeta(res?.meta || {});
    } catch (e) {
      if (!mountedRef.current) return;
      if (ctrl.signal.aborted || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') {
        return;
      }
      setError(e);
      setRows([]);
      setTotal(0);
      setMeta({});
    } finally {
      if (mountedRef.current && abortRef.current === ctrl) setLoading(false);
    }
  }, [params]);

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
    fetchNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    rows,
    total,
    meta,
    loading,
    error,
    refetch: fetchNow,
  };
}

export default useParties;
