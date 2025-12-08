'use client';
// frontend-erp/src/app/(app)/inventory/components/LedgerTable.jsx
import { useMemo } from 'react';
import Table from '@/Components/layout/Table';
import { mapDimension, mapPacking, mapTemperature } from '@/utils/FGP';
import { formatDateDMY } from '@/utils/date';

const TYPE_BADGE = {
  RECEIPT: 'bg-green-100 text-green-700',
  ISSUE: 'bg-red-100 text-red-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  ADJUST: 'bg-amber-100 text-amber-700',
  REPACK: 'bg-purple-100 text-purple-700',
};

/**
 * LedgerTable (pure presentational)
 *
 * Props:
 * - rows: InventoryLedger[] (already fetched by parent)
 * - loading?: boolean
 * - error?: string
 * - filters?: { query?: string, productType?: string, txnType?: string }
 * - limit?: number
 * - onLimitChange?: (n:number) => void
 * - onRefresh?: () => void
 */
export default function LedgerTable({
  rows = [],
  loading = false,
  error = '',
  filters = {},
  limit = 200,
  onLimitChange,
  onRefresh,
  refrence = null,
  hasMore = false,
  onLoadMore,
  serverSearch = false,
}) {
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    let result = rows;

    // 1) Always apply productType filter if provided
    const pt = filters?.productType;
    if (pt) {
      result = result.filter((r) => {
        const item = r.itemId || {};
        return item.productType === pt || r.productType === pt;
      });
    }

    // 2) Always apply txnType filter (except "all types")
    const txn = filters?.txnType;
    if (txn && txn !== 'all types') {
      result = result.filter((r) => r.txnType === txn);
    }

    // 3) Query: only do client-side text search when NOT in serverSearch mode
    if (!serverSearch) {
      const needle = (filters?.query || '').toLowerCase().trim();
      if (!needle) return result;

      const str = (v) => (v == null ? '' : String(v)).toLowerCase();

      result = result.filter((r) => {
        const item = r.itemId || {};

        const tempStr = item?.temperature
          ? `${item.temperature?.value ?? ''} ${item.temperature?.unit ?? ''}`
          : '';
        const denStr = item?.density
          ? `${item.density?.value ?? ''} ${item.density?.unit ?? ''}`
          : '';
        const dimStr = item?.dimension ? mapDimension(item.dimension) : '';
        const pack = item?.packing || {};
        const packStr = [
          pack?.name,
          pack?.brandType,
          pack?.productColor,
          pack?.UOM || pack?.unit,
        ]
          .filter(Boolean)
          .join(' ');
        const nameStr = item?.name || '';

        const haystack = [tempStr, denStr, dimStr, packStr, nameStr]
          .map(str)
          .join(' | ');

        return haystack.includes(needle);
      });
    }

    return result;
  }, [rows, filters, serverSearch]);

  const columns = useMemo(
    () => [
      {
        key: 'at',
        header: 'Date',
        sortable: true,
        render: (r) => <div className='text-sm'>{formatDateDMY(r.at || r.createdAt, true)}</div>,
      },
      {
        key: 'txnType',
        header: 'Type',
        sortable: true,
        render: (r) => (
          <span className={`px-2 py-0.5 rounded text-xs ${TYPE_BADGE[r.txnType] || 'bg-gray-100 text-gray-700'}`}>
            {r.txnType}
          </span>
        ),
      },
      {
        key: 'item',
        header: 'Item',
        render: (r) => r.itemId?.name || r.itemId || '—',
      },
      {
        key: 'temperature',
        header: 'Temperature',
        sortable: true,
        render: (r) =>
          r.itemId?.temperature ? mapTemperature(r.itemId?.temperature) : ('—'),
      },
      {
        key: 'density',
        header: 'Density',
        sortable: true,
        render: (r) => (r.itemId?.density ? r.itemId?.density?.value + ' ' + r.itemId?.density?.unit : '—'),
      },
      {
        key: 'dimension',
        header: 'Dimension',
        sortable: true,
        render: (r) => (r.itemId?.dimension ? mapDimension(r.itemId?.dimension) : '—'),
      },
      {
        key: 'packing',
        header: 'packing',
        sortable: true,
        render: (r) => (r.itemId?.packing ? mapPacking(r.itemId?.packing) : '—'),
      },
      {
        key: 'warehouse',
        header: 'Warehouse',
        render: (r) => r.warehouseId?.name || r.warehouseId || '—',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'quantity',
        header: 'Qty',
        sortable: true,
        align: 'right',
        render: (r) => r.quantity,
      },
      {
        key: 'uom',
        header: 'UOM',
        render: (r) => r.uom || '—',
        align: 'center',
      },
      {
        key: 'batchNo',
        header: 'Batch',
        render: (r) => r.batchNo || '—',
        align: 'center',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'ref',
        header: 'Ref',
        render: (r) => (
          <div className="truncate max-w-[220px]" title={`${r.refType || ''} ${r.refId || ''}`.trim()}>
            {r.refType || '—'} {r.refId || ''}
          </div>
        ),
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'note',
        header: 'Note',
        render: (r) => r.note || '—',
        group: 'other',
        groupLabel: 'Other Info',
        groupCollapsed: true,
      },
      {
        key: 'created',
        header: 'Created',
        render: (r) => (
          <div className="flex items-end justify-center flex-col">
            <div><span className='text-xs text-white-600 capitalize'>{r?.by?.fullName ?? '—'}</span></div>
            {r?.by?.fullName && <div><span className='text-xs text-white-400'>{formatDateDMY(r?.at, true)}</span></div>}
          </div>
        ),
        align: 'right',
        group: 'audit',
        groupLabel: 'Audit fields',
        groupCollapsed: true,   // hidden by default
      },
    ],
    []
  );

  return (
    <>
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : error ? (
        <div className="p-4 text-error">{error}</div>
      ) : (
        <>
          <Table
            columns={columns}
            data={filteredRows}
            rowKey={(r) => r._id}
            virtualization={filteredRows.length > 200}
            loading={loading}
            className='overflow-y-auto'
          />
          {hasMore && (
            <div className="flex justify-center p-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading more…' : 'Load older entries'}
              </button>
            </div>
          )}
        </>
      )}
      </>
  );
}