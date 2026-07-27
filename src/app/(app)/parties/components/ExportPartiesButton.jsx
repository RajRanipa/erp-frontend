
'use client';

import React from 'react';
import { usePartyImportExport } from '../hooks/usePartyImportExport';

export default function ExportPartiesButton({
  role = '',
  status = 'all',
  lifecycleStage = '',
  priority = '',
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
      onClick={() => exportXlsx({
        role,
        status,
        lifecycleStage,
        priority,
        q,
        filename,
      })}
    >
      {children || (exporting ? 'Exporting…' : 'Export')}
    </button>
  );
}
