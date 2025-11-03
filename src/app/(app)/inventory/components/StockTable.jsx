// frontend-erp/src/app/(app)/inventory/components/StockTable.jsx
// frontend-erp/src/app/(app)/inventory/components/StockTable.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
// If your shared Table is in a different path, adjust this import:
import Table from '@/Components/layout/Table';
import CustomInput from '@/Components/inputs/CustomInput';
import { mapDimension, mapPacking } from '@/utils/FGP';

/**
 * StockTable
 * 
 * Shows InventorySnapshot rows with fast filtering (server-side by query params).
 * 
 * Props:
 * - filters?: { itemId?: string, warehouseId?: string, batchNo?: string, uom?: string }
 * - onFiltersChange?: (next) => void   // optional (if you want to control filters above)
 */

export default function StockTable({ filters: controlledFilters, onFiltersChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  // Client-only search (do not hit API)
  const [pt, setPt] = useState('');
  const [q, setQ] = useState('');
  
  const filteredRows = useMemo(() => {
    if (!q && !pt) return rows;
    // need to use pt for filter 
    const needle = String(q).toLowerCase().trim();

    const str = (v) => (v == null ? '' : String(v)).toLowerCase();

    return rows.filter((r) => {
      const item = r.itemId || {};
      // temperature
      const productTypeStr = r?.productType
      ? `${r.productType}`
      : '';
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
        pack?.product_unit || pack?.unit
      ].filter(Boolean).join(' ');

      // item name (optional)
      const nameStr = item?.name || '';

      const haystack = [
        tempStr, denStr, dimStr, packStr, nameStr
      ].map(str).join(' | ');

      if(needle && pt) return haystack.includes(needle) && productTypeStr.includes(pt);
      if(pt) return productTypeStr.includes(pt);
      if(needle) return haystack.includes(needle);
    });
  }, [rows, q, pt]);

  const [localFilters, setLocalFilters] = useState({
    itemId: '',
    warehouseId: '',
    batchNo: '',
    uom: '',
    productType: '',
    query: '',
  });

  // Use controlled filters if provided, else local state
  const filters = controlledFilters || localFilters;
  const setFilters = onFiltersChange || setLocalFilters;

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.itemId) params.set('itemId', filters.itemId);
      if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
      if (filters.batchNo) params.set('batchNo', filters.batchNo);
      if (filters.uom) params.set('uom', filters.uom);
      if (filters.productType) params.set('productType', filters.productType);

      const res = await axiosInstance.get(`/api/inventory/stock?${params.toString()}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      console.log('list stock', list);
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load stock';
      setError(msg);
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters change
  useEffect(() => {
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
   setQ(filters.query || '');
   setPt(filters.productType);
  },[filters]);

  const columns = useMemo(() => ([
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
      render: (r) => r.itemId?.temperature ? <span
        className={`${r.itemId?.temperature?.value > 1400 ? 'text-red-400' : 'text-blue-400'}`}>
        {r.itemId?.temperature?.value+' '+r.itemId?.temperature?.unit}</span> : '—',
    },
    {
      key: 'density',
      header: 'Density',
      sortable: true,
      render: (r) => r.itemId?.density ? (r.itemId?.density?.value+' '+r.itemId?.density?.unit ) : '—',
    },
    {
      key: 'dimension',
      header: 'Dimension',
      sortable: true,
      render: (r) => r.itemId?.dimension ? (mapDimension(r.itemId?.dimension) ) : '—',
    },
    {
      key: 'packing',
      header: 'packing',
      sortable: true,
      render: (r) => r.itemId?.packing ? (mapPacking(r.itemId?.packing)) : '—',
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      sortable: true,
      render: (r) => r.warehouseId?.name || r.warehouseId || '—',
    },
    {
      key: 'batchNo',
      header: 'Batch',
      render: (r) => r.batchNo || '—',
      align: 'center',
    },
    {
      key: 'onHand',
      header: 'On Hand',
      sortable: true,
      align: 'right',
      render: (r) => r.onHand ?? 0,
    },
    {
      key: 'reserved',
      header: 'Reserved',
      sortable: true,
      align: 'right',
      render: (r) => r.reserved ?? 0,
    },
    {
      key: 'available',
      header: 'Available',
      sortable: true,
      align: 'right',
      render: (r) => r.available ?? ((r.onHand ?? 0) - (r.reserved ?? 0)),
    },
    {
      key: 'uom',
      header: 'UOM',
      render: (r) => r.uom || '—',
      align: 'center',
    },
  ]), []);

  return (
    <div className="border rounded-lg overflow-hidden border-color-200">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-color-200 bg-white-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Stock Snapshot</span>
          <span className="text-xs text-white-500">({filteredRows.length} / {rows.length})</span>
        </div>

        <div className="flex gap-2 items-center">
          <button className="text-sm underline" onClick={fetchStock} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

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
        />
      )}
    </div>
  );
}