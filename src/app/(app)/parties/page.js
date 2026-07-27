'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useParties } from './hooks/useParties';
import { usePartySummary } from './hooks/usePartySummary';
import PartiesToolbar from './components/PartiesToolbar';
import PartiesTable from './components/PartiesTable';

function SummaryCard({ label, value, loading, error }) {
  const displayValue = loading ? '…' : error ? '—' : value ?? 0;
  return (
    <div className="card p-3">
      <div className="text-xs text-secondary-text/70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{displayValue}</div>
      {error && (
        <div className="text-xs text-red-400 mt-1">Summary unavailable</div>
      )}
    </div>
  );
}

export default function PartiesPage() {
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('active');
  const [lifecycleStage, setLifecycleStage] = useState('all');
  const [priority, setPriority] = useState('all');
  const [queryText, setQueryText] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const deferredQuery = useDeferredValue(queryText);

  useEffect(() => {
    setPage(1);
  }, [role, status, lifecycleStage, priority, deferredQuery, limit, sort]);

  const query = useMemo(() => ({
    role: role === 'all' ? '' : role,
    status,
    lifecycleStage: lifecycleStage === 'all' ? '' : lifecycleStage,
    priority: priority === 'all' ? '' : priority,
    q: deferredQuery,
    page,
    limit,
    sortBy: sort.key,
    sortOrder: sort.direction,
  }), [
    role,
    status,
    lifecycleStage,
    priority,
    deferredQuery,
    page,
    limit,
    sort,
  ]);

  const { rows, total, meta, loading, error, refetch } = useParties(query);
  const summary = usePartySummary();
  const refreshAll = () => {
    refetch();
    summary.refetch();
  };

  return (
    <div className="space-y-4">
      <PartiesToolbar
        role={role}
        status={status}
        lifecycleStage={lifecycleStage}
        priority={priority}
        q={queryText}
        onRoleChange={setRole}
        onStatusChange={setStatus}
        onLifecycleChange={setLifecycleStage}
        onPriorityChange={setPriority}
        onQueryChange={setQueryText}
        onRefresh={refreshAll}
        loading={loading}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="All partners"
          value={summary.data?.total}
          loading={summary.loading}
          error={summary.error}
        />
        <SummaryCard
          label="Active"
          value={summary.data?.statuses?.active}
          loading={summary.loading}
          error={summary.error}
        />
        <SummaryCard
          label="Customers"
          value={summary.data?.roles?.CUSTOMER}
          loading={summary.loading}
          error={summary.error}
        />
        <SummaryCard
          label="Suppliers"
          value={summary.data?.roles?.SUPPLIER}
          loading={summary.loading}
          error={summary.error}
        />
      </div>

      {error && (
        <div className="card p-3 text-red-400 text-sm">
          {error?.response?.data?.message || error.message || 'Failed to load business partners'}
        </div>
      )}

      <div className="card">
        <PartiesTable
          rows={rows}
          loading={loading}
          sort={sort}
          onSortChange={setSort}
          emptyMessage="No business partners match the current filters."
        />
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-white-100 text-sm">
          <div className="text-secondary-text/70">
            {total
              ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`
              : 'No records'}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 bg-transparent"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              disabled={!meta?.hasPreviousPage || loading}
              onClick={() => setPage(current => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span>Page {meta?.page || page} of {Math.max(meta?.pages || 1, 1)}</span>
            <button
              type="button"
              className="btn-secondary"
              disabled={!meta?.hasNextPage || loading}
              onClick={() => setPage(current => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
