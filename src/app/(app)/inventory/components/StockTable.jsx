// frontend-erp/src/app/(app)/inventory/components/StockTable.jsx
'use client';

import { useMemo } from 'react';
import Table from '@/Components/layout/Table';
import { mapDimension, mapPacking } from '@/utils/FGP';

/**
 * StockTable (presentational + client-side filter only)
 *
 * Props:
 * - rows: InventorySnapshot[]   // raw rows from parent (already fetched)
 * - loading?: boolean
 * - error?: string
 * - filters?: { productType?: string, query?: string }
 */
export default function StockTable({
  rows = [],
  loading = false,
  error = '',
  filters = {},
  refrence = null,
}) {
  const pt = filters.productType || '';
  const q = filters.query || '';
  console.log("rows", rows)
  const filteredRows = useMemo(() => {
    if (!q && !pt) return rows;
    const needle = String(q).toLowerCase().trim();
    const str = (v) => (v == null ? '' : String(v)).toLowerCase();

    return rows.filter((r) => {
      const item = r.itemId || {};
      const productTypeStr = r?.productType ? `${r.productType}` : '';
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

      if (needle && pt) return haystack.includes(needle) && productTypeStr.includes(pt);
      if (pt) return productTypeStr.includes(pt);
      if (needle) return haystack.includes(needle);
      return true;
    });
  }, [rows, q, pt]);

  const columns = useMemo(
    () => [
      {
        key: 'item',
        header: 'Item',
        sortable: true,
        render: (r) => r.itemId?.name || r.itemId || '—',
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
        render: (r) => r.available ?? (r.onHand ?? 0) - (r.reserved ?? 0),
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
      {/* Toolbar */}
      {/* <div className="px-3 py-2 border-b border-color-200 bg-white-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stock Snapshot</span>
          <span className="text-xs text-white-500">({filteredRows.length} / {rows.length})</span>
        </div>
      </div> */}

      {/* Table */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <Table
          columns={columns}
          data={filteredRows}
          rowKey={(r) => `${r.itemId?._id || r.itemId}-${r.warehouseId?._id || r.warehouseId}-${r.batchNo || 'none'}-${r.uom || ''}`}
          virtualization={filteredRows.length > 200}
          loading={loading}
          ref={refrence}
          className='overflow-y-auto'
        />
      )}
    </>
  );
}