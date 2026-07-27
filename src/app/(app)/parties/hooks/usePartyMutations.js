// src/app/(app)/parties/hooks/usePartyMutations.js
'use client';

import { useCallback, useRef, useState } from 'react';

import {
  apiCreateParty,
  apiUpdateParty,
  apiUpdatePartyStatus,
  apiDeleteParty,
  apiRestoreParty,
} from '../lib/partyApi';
import { Toast } from '@/Components/toast';

/**
 * usePartyMutations
 * Centralizes create/update/status/delete for Party.
 * Uses axiosInstance under the hood (cookies auth + interceptors).
 */
export function usePartyMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // allow canceling any in-flight mutation
  const abortRef = useRef(null);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
  }, []);

  const run = useCallback(async (fn, { toastSuccess } = {}) => {
    cancel();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const data = await fn(ctrl.signal);

      if (toastSuccess) Toast.success(toastSuccess);
      return data;
    } catch (err) {
      if (!ctrl.signal.aborted && err?.code !== 'ERR_CANCELED') {
        setError(err);
        Toast.error(err?.response?.data?.message || err?.message || 'Something went wrong');
      }
      throw err;
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [cancel]);

  const createParty = useCallback(
    async (payload, { toast = 'Party created' } = {}) => {
      const response = await run(
        (signal) => apiCreateParty(payload, { signal }),
        { toastSuccess: toast },
      );
      return response?.data || response;
    },
    [run]
  );

  const updateParty = useCallback(
    async (id, payload, { toast = 'Party updated' } = {}) => {
      if (!id) throw new Error('Missing party id');
      const response = await run(
        (signal) => apiUpdateParty(id, payload, { signal }),
        { toastSuccess: toast },
      );
      return response?.data || response;
    },
    [run]
  );

  const setPartyStatus = useCallback(
    async (id, to, { toast = 'Status updated' } = {}) => {
      if (!id) throw new Error('Missing party id');
      if (!to) throw new Error('Missing target status');
      const response = await run(
        (signal) => apiUpdatePartyStatus(id, to, { signal }),
        { toastSuccess: toast },
      );
      return response?.data || response;
    },
    [run]
  );

  const deleteParty = useCallback(
    async (id, { toast = 'Business partner archived' } = {}) => {
      if (!id) throw new Error('Missing party id');
      const response = await run(
        (signal) => apiDeleteParty(id, { signal }),
        { toastSuccess: toast },
      );
      return response?.data || response;
    },
    [run]
  );

  const restoreParty = useCallback(
    async (id, { toast = 'Business partner restored' } = {}) => {
      if (!id) throw new Error('Missing party id');
      const response = await run(
        (signal) => apiRestoreParty(id, { signal }),
        { toastSuccess: toast },
      );
      return response?.data || response;
    },
    [run]
  );

  return {
    loading,
    error,
    cancel,
    createParty,
    updateParty,
    setPartyStatus,
    deleteParty,
    restoreParty,
  };
}

export default usePartyMutations;
