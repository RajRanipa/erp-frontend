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
}) {
  const q = filters.query || '';
  const pt = filters.productType || '';
  const txn = filters.txnType || '';
  console.log('rows LedgerTable', rows[0]);
  // filtered rows based on q, productType, txnType
  const filteredRows = useMemo(() => {
    const needle = (q || '').toLowerCase().trim();
    const ptId = pt ? String(pt) : '';
    const activeTxn = txn && txn.toLowerCase() !== 'all types' ? txn.toLowerCase().trim() : '';

    if (!needle && !ptId && !activeTxn) return rows;

    const str = (v) => (v == null ? '' : String(v)).toLowerCase();

    return rows.filter((r) => {
      const item = r.itemId || {};
      const txnTypeStr = str(r?.txnType);
      const rowPt = String(r?.productType || item?.productType || '');

      const tempStr = item?.temperature ? `${item.temperature?.value ?? ''} ${item.temperature?.unit ?? ''}` : '';
      const denStr = item?.density ? `${item.density?.value ?? ''} ${item.density?.unit ?? ''}` : '';
      const dimStr = item?.dimension ? mapDimension(item.dimension) : '';
      const pack = item?.packing || {};
      const packStr = [pack?.name, pack?.brandType, pack?.productColor, pack?.UOM || pack?.unit]
        .filter(Boolean)
        .join(' ');
      const nameStr = item?.name || '';

      const haystack = [tempStr, denStr, dimStr, packStr, nameStr].map(str).join(' | ');

      const matchQ = !needle || haystack.includes(needle);
      const matchPt = !ptId || rowPt === ptId;
      const matchTxn = !activeTxn || txnTypeStr === activeTxn;

      return matchQ && matchPt && matchTxn;
    });
  }, [rows, q, pt, txn]);

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
    <div className="rounded-lg overflow-hidden flex-1" ref={refrence}>
      {/* Header */}
      {/* <div className="px-3 py-2 border-b border-color-200 bg-white-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stock Movements</span>
          <span className="text-xs text-white-500">({filteredRows.length} shown)</span>
        </div>

        <div className="flex gap-2 items-center">
          <SelectInput
            key={'limit'}
            name="limit"
            value={limit || 50}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            options={[50, 100, 200, 500].map((n) => ({ value: n, label: n }))}
            className="px-2 py-1 text-sm min-w-[70px]"
            parent_className="mb-0"
          />
          {onRefresh && (
            <button className="text-sm underline" onClick={onRefresh} disabled={loading} title="Refresh">
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          )}
        </div>
      </div> */}

      {/* Table */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : error ? (
        <div className="p-4 text-error">{error}</div>
      ) : (
        <Table
          columns={columns}
          data={filteredRows}
          rowKey={(r) => r._id}
          virtualization={filteredRows.length > 200}
          loading={loading}
        />
      )}
    </div>
  );
}