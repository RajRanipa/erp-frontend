'use client';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavLink from '@/Components/NavLink';
import Table from '@/Components/layout/Table';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';

export default function ProductionOrdersPage() {
  const { can } = useAuthz();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/manufacturing-v2/orders', {
        params: { status: status || undefined },
      });
      setRows(response.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load Production Orders');
    } finally {
      setLoading(false);
    }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    {
      key: 'orderNo',
      header: 'Order',
      render: row => (
        <Link className="text-blue-500 hover:underline" href={`/manufacturing/orders/${row._id}`}>
          {row.orderNo}
        </Link>
      ),
    },
    {
      key: 'item',
      header: 'Output Item',
      render: row => `${row.outputItemId?.sku || ''} · ${row.outputItemId?.name || ''}`,
    },
    {
      key: 'plannedQuantity',
      header: 'Planned',
      align: 'right',
      render: row => `${row.plannedQuantity} ${row.outputUom}`,
    },
    {
      key: 'actualOutputQuantity',
      header: 'Actual',
      align: 'right',
      render: row => `${row.actualOutputQuantity} ${row.outputUom}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: row => <span className="capitalize">{row.status.toLowerCase().replaceAll('_', ' ')}</span>,
    },
    {
      key: 'warehouse',
      header: 'Output Warehouse',
      render: row => row.outputWarehouseId?.name || '—',
    },
  ], []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Production Orders</h1>
          <p className="mt-1 text-sm text-secondary-text">
            Frozen recipe requirements, material genealogy and operation progress.
          </p>
        </div>
        {can('production:create') && (
          <NavLink href="/manufacturing/orders/create" type="button">
            Create Production Order
          </NavLink>
        )}
      </div>
      <div className="max-w-xs">
        <AdaptiveSelectInput
          label="Status"
          name="orderStatus"
          placeholder="All statuses"
          value={status}
          onChange={event => setStatus(event.target.value)}
          options={['DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            .map(value => ({ value, label: value.replaceAll('_', ' ') }))}
        />
      </div>
      <Table
        columns={columns}
        data={rows}
        rowKey={row => row._id}
        loading={loading}
        pageSize={25}
        emptyMessage="No Production Orders found."
      />
    </div>
  );
}
