'use client';

import { useMemo } from 'react';
import Table from '@/Components/layout/Table';
import { mapDimension, mapPacking, mapTemperature } from '@/utils/FGP';
import { useHighlight } from '@/hooks/useHighlight';

/**
 * StockTable (presentational + client-side filter only)
 *
 * Props:
 * - rows: InventorySnapshot[]   // raw rows from parent (already fetched)
 * - loading?: boolean
 * - error?: string
 * - filters?: { productType?: string, query?: string }
 */
export default function ProductionTableSpecific({
  rows = [],
  loading = false,
  error = '',
  filters = {},
  refrence = null,
}) {
  const pt = filters.productType || '';
  const st = filters?.status || '';
  const q = filters.query || '';
  const stockTabelRef = useHighlight((filters?.query || '').toLowerCase().trim(), 'textHighlight');

  const filteredRows = useMemo(() => {
    if (!q && !pt) return rows;
    const needle = String(q).toLowerCase().trim();
    const str = (v) => (v == null ? '' : String(v)).toLowerCase();
    const newst = st === "false" ? false : st === "true" ? true : st
    return rows.filter((r) => {
      // const item = r.itemId || {};
      // console.log("item specific", item)
      const productTypeStr = r?.productType ? `${r.productType._id}` : '';
      const statusValue = r.statusOk;
      typeof statusValue === "boolean"
      const tempStr = rows?.temperature
        ? `${r.temperature?.value ?? ''} ${r.temperature?.unit ?? ''}`
        : '';
      const denStr = rows?.density
        ? `${r.density?.value ?? ''} ${r.density?.unit ?? ''}`
        : '';
      const dimStr = r?.dimension ? mapDimension(r.dimension) : '';
      const pack = r?.packing || {};
      const packStr = [
        pack?.name,
        pack?.brandType,
        pack?.productColor,
        pack?.UOM || pack?.unit,
      ]
        .filter(Boolean)
        .join(' ');
      const nameStr = r?.name || ''; // if we want to filter by name as well latter we can use this
      const gradeStr = r?.grade || '';

      const haystack = [tempStr, denStr, dimStr, packStr, gradeStr]
        .map(str)
        .join(' | ');
      if (needle && pt) return needle.split(' ').every((w) => haystack.includes(w)) && productTypeStr.includes(pt);
      if (pt && st !== "") return productTypeStr.includes(pt) &&statusValue === newst;
      if (st !== "") return statusValue === newst;
      if (pt) return productTypeStr.includes(pt);
      if (needle) return needle.split(' ').every((w) => haystack.includes(w));
      return true;
    });
  }, [rows, q, pt, st]);

  const formatTimeIST = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const columns = useMemo(
    () => [
      {
        key: 'srno',
        header: 'Sr No.',
        sortable: false,
        render: (_row, index) => index + 1,
      },
      {
        key: 'item',
        header: 'Item',
        sortable: true,
        render: (r) => r.matchedItem?.name || '—',
      },
      {
        key: 'productType',
        header: 'Product Type',
        sortable: true,
        render: (r) => r.productType?.name || '—',
      },
      {
        key: 'temperature',
        header: 'Temperature',
        sortable: true,
        render: (r) =>
          r.temperature
            ? mapTemperature(r.temperature)
            : '—',
      },
      {
        key: 'density',
        header: 'Density',
        sortable: true,
        render: (r) =>
          r.density
            ? `${r.density?.value} ${r.density?.unit}`
            : '—',
      },
      {
        key: 'dimension',
        header: 'Dimension',
        sortable: true,
        render: (r) =>
          r.dimension
            ? mapDimension(r?.dimension)
            : '—',
      },
      {
        key: 'packing',
        header: 'Packing',
        sortable: true,
        render: (r) => r.packingItem ? mapPacking(r.packingItem) : '—',
      },
      {
        key: 'statusOk',
        header: 'Status',
        sortable: true,
        align: 'center',
        render: (r) =>
          typeof r.statusOk === 'boolean' ? (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${r.statusOk
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}
            >
              {r.statusOk ? 'OK' : 'Rejected'}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'totalRolls',
        header: 'Total Rolls',
        sortable: true,
        align: 'right',
        render: (r) => 1 ?? 0,
      },
      {
        key: 'Weight',
        header: 'Weight',
        sortable: true,
        align: 'right',
        render: (r) => `${(r.weightKg ?? 0).toFixed(2)} kg`,
      },
      {
        key: 'time',
        header: 'Time',
        sortable: true,
        align: 'right',
        render: (r) => `${formatTimeIST(r.at)}`,
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
          rowKey={(r) => r?._id}
          virtualization={filteredRows.length > 200}
          loading={loading}
          tableRef={stockTabelRef}
          className='overflow-y-auto'
        />
      )}
    </>
  );
}