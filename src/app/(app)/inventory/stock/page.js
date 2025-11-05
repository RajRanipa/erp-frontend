'use client';
// src/app/(app)/inventory/stock/page.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Inventory from '../page';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import StockFilters from '../components/StockFilters';
import StockTable from '../components/StockTable';
import Loading from '@/Components/Loading';
import NavLink from '@/Components/NavLink';

export default function InventoryStock() {
  // Filters controlled here; StockFilters merges via onChange(patch)
  const [filters, setFilters] = useState({
    itemId: '',
    warehouseId: '',
    batchNo: '',
    productType: '',
    query: '',
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/inventory/stock`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load stock';
      setError(msg);
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // If you truly want to render both widgets only when data exists:
  // const ready = rows.length > 0 && !loading && !error;
  // But usually we render filters first anyway. Your call:
  const ready = !loading && !error; // show table once the initial fetch resolved (even if empty)

  return (
    <Inventory>
      {ready ? <div className="space-y-4">
        {(rows && rows.length>0) ? <>
          {/* Filters always visible (recommended) */}
          <StockFilters
            value={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            showTxnType={false} // hide txnType for Stock page
          />

          {/* Table area */}
          <StockTable
            rows={rows}
            loading={loading}
            error={error}
            onRefresh={fetchStock}
            filters={filters} // used for client-side query + productType filtering
          />
        </>: <div className='flex items-center justify-center gap-0 text-white-500 flex-col min-h-50 capitalize'>Add Receipt Entry for items <NavLink href="/inventory/create" type='link' className='underline text-action'>here</NavLink> to get started.</div>}
      </div> : <Loading variant='skeleton' className='h-full' />}
    </Inventory>
  );
}