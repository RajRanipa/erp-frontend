'use client';

import { useEffect, useState } from 'react';
import { apiPartyAccountOwners } from '../lib/partyApi';

export function usePartyAccountOwners() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiPartyAccountOwners({}, { signal: controller.signal })
      .then(response => setOptions(Array.isArray(response?.data) ? response.data : []))
      .catch(error => {
        if (error?.code !== 'ERR_CANCELED') setOptions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { options, loading };
}
