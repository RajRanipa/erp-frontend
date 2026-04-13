

// src/app/(app)/parties/hooks/usePartyImportExport.js
'use client';

import { useCallback, useRef, useState } from 'react';
import { Toast } from '@/Components/toast';

import {
  apiExportPartiesXlsx,
  apiImportPartiesXlsx,
  downloadBlob,
} from '../lib/partyApi';

/**
 * usePartyImportExport
 * Keeps Excel import/export logic reusable across pages/modals.
 * Relies on axiosInstance + cookies (inside partyApi).
 */
export function usePartyImportExport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
  }, []);

  const exportXlsx = useCallback(
    async ({ role = '', status = 'all', q = '', filename } = {}) => {
      cancel();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setExporting(true);
      setError(null);

      try {
        const blob = await apiExportPartiesXlsx({ role, status, q }, { signal: ctrl.signal });
        const safeName = filename || `parties_${Date.now()}.xlsx`;
        downloadBlob(blob, safeName);
        Toast.success('Export completed');
        return { ok: true };
      } catch (err) {
        setError(err);
        Toast.error(err?.response?.data?.message || err?.message || 'Export failed');
        throw err;
      } finally {
        setExporting(false);
      }
    },
    [cancel]
  );

  const importXlsx = useCallback(
    async (file) => {
      if (!file) throw new Error('Missing file');

      const name = String(file.name || '').toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
        const err = new Error('Please upload an Excel file (.xlsx or .xls)');
        Toast.error(err.message);
        throw err;
      }

      cancel();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setImporting(true);
      setError(null);

      try {
        const res = await apiImportPartiesXlsx(file, { signal: ctrl.signal });
        const summary = res?.summary;

        Toast.success(
          summary
            ? `Import done: created ${summary.created || 0}, updated ${summary.updated || 0}, failed ${summary.failed || 0}`
            : 'Import completed'
        );

        return res;
      } catch (err) {
        setError(err);
        Toast.error(err?.response?.data?.message || err?.message || 'Import failed');
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [cancel]
  );

  return {
    exporting,
    importing,
    error,
    cancel,
    exportXlsx,
    importXlsx,
  };
}

export default usePartyImportExport;