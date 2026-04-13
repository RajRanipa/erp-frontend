// src/app/(app)/parties/page.js
'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useParties } from './hooks/useParties';
import PartiesToolbar from './components/PartiesToolbar';
import PartiesTable from './components/PartiesTable';

export default function PartiesPage() {
  const router = useRouter();

  // Filters
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('active');
  const [q, setQ] = useState('');

  // Debounced search
  const dq = useDeferredValue(q);

  // Reset to page 1 when filters/search change
  // no local pagination now, so no page reset needed
  // useEffect omitted as it was empty

  // Hook expects role/status/q/page/limit (keep this signature)
  // NOTE: new backend uses roles[] and status active|inactive|all
  // We pass role only when it's not 'all'
  const query = useMemo(() => {
    return {
      role: role === 'all' ? '' : role,
      status: status === 'all' ? 'all' : status,
      q: dq,
      page: 1,
      limit: 200,
    };
  }, [role, status, dq]);

  const { rows = [], total = 0, loading, refetch } = useParties(query);

  return (
    <div>

      <PartiesToolbar
        role={role}
        status={status}
        q={q}
        onRoleChange={setRole}
        onStatusChange={setStatus}
        onQueryChange={setQ}
        onRefresh={() => refetch?.()}
        loading={loading}
      />

      <div className="card mt-4">
        <PartiesTable
          rows={rows}
          loading={loading}
          emptyMessage={
            role === 'all' && status === 'active' && !dq
              ? 'No parties found. Create your first party.'
              : 'No parties found for current filters.'
          }
        />
      </div>
    </div>
  );
}