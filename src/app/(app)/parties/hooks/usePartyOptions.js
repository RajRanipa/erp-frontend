// src/app/(app)/parties/hooks/usePartyOptions.js
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiPartyOptions } from '../lib/partyApi';

function stableKey(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch {
    return String(Date.now());
  }
}

/**
 * usePartyOptions
 * Lightweight options endpoint used in dropdowns/autocomplete.
 *
 * Backend expected shape (typical):
 *  { status: true, data: [{ _id, name, roles, phone, taxProfile }...], meta?: {...} }
 *
 * Returned from this hook:
 *  - options: normalized { value, label, raw }
 *  - rows: raw party rows
 */
export function usePartyOptions(params = {}) {
  const key = useMemo(() => stableKey(params), [params]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchNow = useCallback(async () => {
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
      const res = await apiPartyOptions(params, { signal: ctrl.signal });
      if (!mountedRef.current) return;

      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(list);
    } catch (e) {
      if (!mountedRef.current) return;
      if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
      setError(e);
      setRows([]);
    } finally {
      if (mountedRef.current) setLoading(false);
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

  const options = useMemo(() => {
    return (rows || []).map((p) => {
      const name = p?.name || p?.legalName || 'Unnamed';
      const taxId = p?.taxProfile?.taxId ? ` • ${p.taxProfile.taxId}` : '';
      const phone = p?.phone ? ` • ${p.phone}` : '';
      return {
        value: p._id,
        label: `${name}${taxId}${phone}`,
        raw: p,
      };
    });
  }, [rows]);

  return {
    options,
    rows,
    loading,
    error,
    refetch: fetchNow,
  };
}

export default usePartyOptions;
