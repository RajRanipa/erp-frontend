'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomInput from '@/Components/inputs/CustomInput';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import Table from '@/Components/layout/Table';
import { Toast } from '@/Components/toast';
import { apiErrorMessage, itemMasterApi } from './itemMasterApi';

const statusOptions = [
  'draft',
  'in_review',
  'returned',
  'approved',
  'active',
  'blocked',
  'archived',
].map(value => ({ value, label: value.replaceAll('_', ' ') }));

const STATUS_STYLES = {
  // Draft: neutral, muted
  draft: {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700',
    dot: 'bg-zinc-400 dark:bg-zinc-500',
  },
  // In Review: informational / pending attention
  in_review: {
       badge: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
  // Returned: warning / needs action
  returned: {
    badge: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/60',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
  },
  // Approved: milestone reached, calm green/violet
  approved: {
     badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  // Active: production ready / live
  active: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  // Blocked: high severity / stopped
  blocked: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  // Archived: out of circulation / faded
  archived: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
};

export default function ItemMasterCatalogPage() {
  const [rows, setRows] = useState([]);
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [status, setStatus] = useState('');

  // 1. Fetch only on filter/setup changes, omitting search from the API call
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSetup, response] = await Promise.all([
        setup ? Promise.resolve(setup) : itemMasterApi.setup(),
        itemMasterApi.list({
          familyId: familyId || undefined,
          status: status || undefined,
          limit: 100, // Increase limit if you need all records client-side
        }),
      ]);
      setSetup(nextSetup);
      setRows(response.data || []);
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to load Item Master'));
    } finally {
      setLoading(false);
    }
  }, [setup, familyId, status]);

  // 2. Fetch data directly when family or status changes.
  useEffect(() => {
    load();
  }, [load]);

  // 3. Filter data locally in memory
  const filteredRows = useMemo(() => {
    // Split by one or more whitespace characters and filter out empty strings
    const keywords = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (keywords.length === 0) return rows;

    return rows.filter(row => {
      const sku = (row.sku || '').toLowerCase();
      const name = (row.name || '').toLowerCase();
      const family = (row.familyId?.name || '').toLowerCase();
      const itemClass = (row.itemClassId?.name || '').toLowerCase();
      const specifications = (row.attributes || [])
        .map(attr => attr.displayValue || '')
        .join(' ')
        .toLowerCase();

      // Combine all searchable fields into one target string
      const searchableText = `${sku} ${name} ${family} ${itemClass} ${specifications}`;
      // Ensure all tokens (e.g. "blanket", "1260", "96", "50") are found in the row
      return keywords.every(token => searchableText.includes(token));
    });
  }, [rows, search]);

  const columns = useMemo(() => [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: row => (
        <Link
          className="text-blue-500 hover:underline"
          href={`/items/catalog/${row._id}`}
          prefetch={false}
        >
          {row.sku}
        </Link>
      ),
    },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'family',
      header: 'Family',
      render: row => row.familyId?.name || '—',
    },
    {
      key: 'itemClass',
      header: 'Class',
      render: row => row.itemClassId?.name || '—',
    },
    {
      key: 'specification',
      header: 'Specification',
      render: row => (
        <span className="text-secondary-text">
          {(row.attributes || []).map(attribute => attribute.displayValue).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'uom',
      header: 'UOM',
      render: row => row.catchUom
        ? `${row.baseUom} / ${row.catchUom}`
        : row.baseUom,
    },

    {
      key: 'status',
      header: 'Status',
      render: row => {
        const statusKey = row.status || 'draft';
        const style = STATUS_STYLES[statusKey] || STATUS_STYLES.draft;

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            <span className="capitalize">{statusKey.replaceAll('_', ' ')}</span>
          </span>
        );
      },
    },
    // {
    //   key: 'status',
    //   header: 'Status',
    //   render: row => (
    //     <span className="capitalize">{row.status.replaceAll('_', ' ')}</span>
    //   ),
    // },
  ], []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-primary-text">Item Master</h1>
        <p className="mt-1 text-sm text-secondary-text">
          One catalog for purchased materials, packaging, intermediates, by-products and finished goods.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
        <CustomInput
          label="Search"
          name="itemSearch"
          placeholder="SKU, name or specification value"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <AdaptiveSelectInput
          label="Family"
          name="familyFilter"
          placeholder="All families"
          value={familyId}
          onChange={event => setFamilyId(event.target.value)}
          options={(setup?.families || []).map(family => ({
            value: family._id,
            label: family.name,
          }))}
        />
        <AdaptiveSelectInput
          label="Status"
          name="statusFilter"
          placeholder="All statuses"
          value={status}
          onChange={event => setStatus(event.target.value)}
          options={statusOptions}
        />
      </div>
      <Table
        columns={columns}
        data={filteredRows}
        rowKey={row => row._id}
        loading={loading}
        pageSize={25}
        emptyMessage="No Item Master records match these filters."
      />
    </div>
  );
}
