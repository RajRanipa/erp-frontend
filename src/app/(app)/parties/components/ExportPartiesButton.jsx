
'use client';

import React from 'react';
import { usePartyImportExport } from '../hooks/usePartyImportExport';

/**
 * ExportPartiesButton
 * Downloads parties as XLSX.
 *
 * Props:
 *  - role?: string ('' | 'SUPPLIER' | 'CUSTOMER' ...)
 *  - status?: string ('all'|'active'|'inactive')
 *  - q?: string
 *  - filename?: string
 *  - className?: string
 *  - children?: ReactNode
 */
export default function ExportPartiesButton({
  role = '',
  status = 'all',
  q = '',
  filename,
  className = 'btn-secondary',
  children,
}) {
  const { exporting, exportXlsx } = usePartyImportExport();

  return (
    <button
      type="button"
      className={className}
      disabled={exporting}
      onClick={() => exportXlsx({ role, status, q, filename })}
    >
      {children || (exporting ? 'Exporting…' : 'Export')}
    </button>
  );
}
