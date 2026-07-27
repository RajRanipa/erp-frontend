// frontend-erp/src/app/(app)/inventory/components/StockTable.jsx
'use client';

import { useMemo } from 'react';
import Table from '@/Components/layout/Table';
import { mapDimension, mapPacking } from '@/utils/FGP';
import { useHighlight } from '@/hooks/useHighlight';

/**
 * StockTable is presentational. Filtering is performed by the backend so
 * related specification values and the complete paginated dataset are used.
 *
 * Props:
 * - rows: InventorySnapshot[]   // raw rows from parent (already fetched)
 * - loading?: boolean
 * - error?: string
 * - search?: string
 */
export default function StockTable({
  rows = [],
  loading = false,
  error = '',
  search = '',
}) {
  const stockTabelRef = useHighlight(
    String(search).toLowerCase().trim(),
    'textHighlight',
  );

  const columns = useMemo(
    () => [
      {
        key: 'item',
        header: 'Item',
        sortable: true,
        render: (r) => r.itemId?.name || r.itemId || '—',
      },
      {
        key: 'categoryKey',
        header: 'Category',
        sortable: true,
        render: (r) => r.itemId?.categoryKey || r.categoryKey || '—',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'temperature',
        header: 'Temperature',
        sortable: true,
        render: (r) =>
          r.itemId?.temperature ? (
            <span className={`${r.itemId?.temperature?.value > 1400 ? 'text-red-400' : 'text-blue-400'}`}>
              {r.itemId?.temperature?.value + ' ' + r.itemId?.temperature?.unit}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'density',
        header: 'Density',
        sortable: true,
        render: (r) =>
          r.itemId?.density ? r.itemId?.density?.value + ' ' + r.itemId?.density?.unit : '—',
      },
      {
        key: 'dimension',
        header: 'Dimension',
        sortable: true,
        render: (r) => (r.itemId?.dimension ? mapDimension(r.itemId?.dimension) : '—'),
      },
      {
        key: 'grade',
        header: 'Grade',
        sortable: true,
        render: (r) => (r.itemId?.grade ? (r.itemId?.grade) : '—'),
      },
      {
        key: 'packing',
        header: 'Packing',
        sortable: true,
        render: (r) => (r.itemId?.packing ? mapPacking(r.itemId?.packing) : '—'),
      },
      {
        key: 'warehouse',
        header: 'Warehouse',
        className: 'hidden lg:table-cell',
        sortable: true,
        render: (r) => r.warehouseId?.name || r.warehouseId || '—',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },/* for mobile version i want to hide this column from tabel so it's look good on mobile */
      {
        key: 'batchNo',
        header: 'Batch',
        className: 'hidden lg:table-cell',
        render: (r) => r.batchNo || '—',
        align: 'center',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'bin',
        header: 'Bin',
        className: 'hidden lg:table-cell',
        render: (r) => r.bin || '—',
        align: 'center',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'onHand',
        header: 'On Hand',
        sortable: true,
        align: 'right',
        className: 'hidden lg:table-cell',
        render: (r) => r.onHand ?? 0,
      },
      {
        key: 'reserved',
        header: 'Reserved',
        sortable: true,
        align: 'right',
        className: 'hidden lg:table-cell',
        render: (r) => r.reserved ?? 0,
      },
      {
        key: 'available',
        header: 'Available',
        sortable: true,
        align: 'right',
        render: (r) => {
          const available = r.available ?? (r.onHand ?? 0) - (r.reserved ?? 0);
          const minimum = Number(r.itemId?.minimumStock || 0);
          return (
            <span
              className={minimum > 0 && available <= minimum ? 'text-error font-semibold' : ''}
              title={minimum > 0 ? `Minimum stock: ${minimum}` : undefined}
            >
              {available}
            </span>
          );
        },
      },
      {
        key: 'uom',
        header: 'UOM',
        render: (r) => r.uom || '—',
        align: 'center',
      },
    ],
    []
  );

  return (
    <>
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          rowKey={(r) => r._id || `${r.itemId?._id || r.itemId}-${r.warehouseId?._id || r.warehouseId}-${r.batchNo || 'none'}-${r.bin || 'none'}-${r.uom || ''}`}
          virtualization={rows.length > 200}
          loading={loading}
          tableRef={stockTabelRef}
          className='overflow-y-auto'
        />
      )}
    </>
  );
}
