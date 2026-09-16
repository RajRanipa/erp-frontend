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

export default function ItemMasterCatalogPage() {
  const [rows, setRows] = useState([]);
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSetup, response] = await Promise.all([
        setup ? Promise.resolve(setup) : itemMasterApi.setup(),
        itemMasterApi.list({
          search: search.trim() || undefined,
          familyId: familyId || undefined,
          status: status || undefined,
          limit: 100,
        }),
      ]);
      setSetup(nextSetup);
      setRows(response.data || []);
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to load Item Master'));
    } finally {
      setLoading(false);
    }
  }, [setup, search, familyId, status]);

  useEffect(() => {
    const timeout = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  const columns = useMemo(() => [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: row => (
        <Link className="text-blue-500 hover:underline" href={`/items/catalog/${row._id}`}>
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
      render: row => (
        <span className="capitalize">{row.status.replaceAll('_', ' ')}</span>
      ),
    },
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
        data={rows}
        rowKey={row => row._id}
        loading={loading}
        pageSize={25}
        emptyMessage="No Item Master records match these filters."
      />
    </div>
  );
}
