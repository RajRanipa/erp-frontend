

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';

// Small status badge for Party status.
// Expected values: 'active' | 'inactive' | 'archived' (optional) | anything else

export default function PartyStatusBadge({ status, className = '' }) {
  const s = String(status || '').toLowerCase();

  const { label, cls } = useMemo(() => {
    if (s === 'active') {
      return {
        label: 'Active',
        cls: 'bg-green-500/15 text-green-300 border-green-500/30',
      };
    }
    if (s === 'inactive') {
      return {
        label: 'Inactive',
        cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      };
    }
    if (s === 'archived') {
      return {
        label: 'Archived',
        cls: 'bg-gray-500/15 text-gray-200 border-gray-500/30',
      };
    }

    return {
      label: status ? String(status) : '—',
      cls: 'bg-white-200 text-secondary-text border-white-200',
    };
  }, [s, status]);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        cls,
        className
      )}
    >
      {label}
    </span>
  );
}