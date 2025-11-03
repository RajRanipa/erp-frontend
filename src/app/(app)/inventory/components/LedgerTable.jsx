'use client';
// frontend-erp/src/app/(app)/inventory/components/LedgerTable.jsx
import { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SelectInput from '@/Components/inputs/SelectInput';
import Table from '@/Components/layout/Table';
import { mapDimension, mapPacking } from '@/utils/FGP';
import { formatDateDMY } from '@/utils/date';

const TYPE_BADGE = {
  RECEIPT: 'bg-green-100 text-green-700',
  ISSUE: 'bg-red-100 text-red-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  ADJUST: 'bg-amber-100 text-amber-700',
  REPACK: 'bg-purple-100 text-purple-700',
};

export default function LedgerTable({ filters: controlledFilters, onFiltersChange }) {
  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(200);

  // local filters (used only when parent didn't provide controlled filters)
  const [localFilters, setLocalFilters] = useState({
    itemId: '',
    warehouseId: '',
    batchNo: '',
    uom: '',
    productType: '',
    query: '',
    txnType: '',
  });

  // decide source of truth
  const filters = controlledFilters || localFilters;
  const setFilters = onFiltersChange || setLocalFilters;

  // local UI states derived from filters
  const [q, setQ] = useState('');
  const [pt, setPt] = useState('');
  const [txn, setTxn] = useState('');

  // whenever parent changes filters, sync but ONLY fields that were actually sent
  useEffect(() => {
    if (!filters) return;
    setQ((prev) =>
      filters.query !== undefined ? (filters.query || '') : prev
    );
    setPt((prev) =>
      filters.productType !== undefined ? filters.productType : prev
    );
    setTxn((prev) =>
      filters.txnType !== undefined ? (filters.txnType || '') : prev
    );
  }, [filters]);

  // fetch ledger data
  const fetchLedger = async (currentLimit = limit) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/inventory/ledger?limit=${currentLimit}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load movements';
      setError(msg);
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchLedger(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when limit changes
  useEffect(() => {
    fetchLedger(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // filtered rows based on q, productType, txnType
  const filteredRows = useMemo(() => {
    // normalize
    const needle = (q || '').toLowerCase().trim();
    const ptId = pt ? String(pt) : '';
    const activeTxn =
      txn && txn.toLowerCase() !== 'all types'
        ? txn.toLowerCase().trim()
        : '';

    // console.log("needle :- ", needle, "ptId :- ", ptId, "activeTxn :- ", activeTxn)
    if (!needle && !ptId && !activeTxn) return rows;

    const str = (v) => (v == null ? '' : String(v)).toLowerCase();

    return rows.filter((r) => {
      const item = r.itemId || {};

      // txn type on row
      const txnTypeStr = str(r?.txnType);

      // productType can be on row or nested under item
      const rowPt = String(r?.productType || item?.productType || '');

      // temperature
      const tempStr = item?.temperature
        ? `${item.temperature?.value ?? ''} ${item.temperature?.unit ?? ''}`
        : '';
      // density
      const denStr = item?.density
        ? `${item.density?.value ?? ''} ${item.density?.unit ?? ''}`
        : '';
      // dimension / size
      const dimStr = item?.dimension ? mapDimension(item.dimension) : '';
      // packing
      const pack = item?.packing || {};
      const packStr = [
        pack?.name,
        pack?.brandType,
        pack?.productColor,
        pack?.product_unit || pack?.unit,
      ]
        .filter(Boolean)
        .join(' ');

      const nameStr = item?.name || '';

      const haystack = [tempStr, denStr, dimStr, packStr, nameStr]
        .map(str)
        .join(' | ');

      // individual matches
      const matchQ = !needle || haystack.includes(needle);
      const matchPt = !ptId || rowPt === ptId;
      const matchTxn = !activeTxn || txnTypeStr === activeTxn;

      // AND all active filters
      return matchQ && matchPt && matchTxn;
    });
  }, [rows, q, pt, txn]);

  // columns
  const columns = useMemo(
    () => [
      {
        key: 'at',
        header: 'Date',
        sortable: true,
        render: (r) => formatDateDMY(r.at || r.createdAt, true),
      },
      {
        key: 'txnType',
        header: 'Type',
        sortable: true,
        render: (r) => (
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              TYPE_BADGE[r.txnType] || 'bg-gray-100 text-gray-700'
            }`}
          >
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
          r.itemId?.temperature ? (
            <span
              className={`${
                r.itemId?.temperature?.value > 1400
                  ? 'text-red-400'
                  : 'text-blue-400'
              }`}
            >
              {r.itemId?.temperature?.value +
                ' ' +
                r.itemId?.temperature?.unit}
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
          r.itemId?.density
            ? r.itemId?.density?.value + ' ' + r.itemId?.density?.unit
            : '—',
      },
      {
        key: 'dimension',
        header: 'Dimension',
        sortable: true,
        render: (r) =>
          r.itemId?.dimension ? mapDimension(r.itemId?.dimension) : '—',
      },
      {
        key: 'packing',
        header: 'packing',
        sortable: true,
        render: (r) =>
          r.itemId?.packing ? mapPacking(r.itemId?.packing) : '—',
      },
      {
        key: 'warehouse',
        header: 'Warehouse',
        render: (r) => r.warehouseId?.name || r.warehouseId || '—',
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
      },
      {
        key: 'ref',
        header: 'Ref',
        render: (r) => (
          <div
            className="truncate max-w-[220px]"
            title={`${r.refType || ''} ${r.refId || ''}`.trim()}
          >
            {(r.refType || '—')} {r.refId || ''}
          </div>
        ),
      },
      {
        key: 'note',
        header: 'Note',
        render: (r) => r.note || '—',
      },
    ],
    []
  );

  return (
    <div className="border rounded-lg overflow-hidden border-color-200">
      {/* Header */}
      <div className="px-3 py-2 border-b border-color-200 bg-white-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stock Movements</span>
          <span className="text-xs text-white-500">
            ({filteredRows.length} shown)
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <SelectInput
            key={'limit'}
            name="limit"
            value={limit || 50}
            onChange={(e) => setLimit(Number(e.target.value))}
            options={[50, 100, 200, 500].map((n) => ({
              value: n,
              label: n,
            }))}
            className="px-2 py-1 text-sm min-w-[70px]"
            parent_className="mb-0"
          />
          <button
            className="text-sm underline"
            onClick={() => fetchLedger(limit)}
            disabled={loading}
            title="Refresh"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

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