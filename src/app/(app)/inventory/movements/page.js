// frontend-erp/src/app/(app)/inventory/movements/page.js
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Inventory from '../page';
import StockFilters from '../components/StockFilters';
import LedgerTable from '../components/LedgerTable';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Loading from '@/Components/Loading';

export default function InventoryMovement() {
  const defaultFilters = useMemo(() => ({
    itemId: '',
    productType: '',
    txnType: 'all types',
    warehouseId: '',
    batchNo: '',
    query: '',
  }), []);

  const [filters, setFilters] = useState(defaultFilters);
  const [rows, setRows] = useState([]);
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/inventory/ledger?limit=${limit}`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load movements';
      setError(msg);
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleFiltersChange = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  return (
    <div>
      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <Loading variant="skeleton" className="h-[140px]" />
          <Loading variant="skeleton" className="h-[420px]" />
        </div>
      )}
      {(!loading && !error) &&
        <div className="space-y-4">
          {rows && rows.length > 0 ? <>
            <StockFilters 
              title="Stock Movements"
              value={filters} 
              onChange={handleFiltersChange} 
              loading={loading}
              onRefresh={fetchLedger}
              StockFiltersRef={setRefresh}
            />
            <LedgerTable
              rows={rows}
              loading={loading}
              error={error}
              filters={filters}
              limit={limit}
              onLimitChange={setLimit}
              refrence={refresh}
            />
          </> :
            <div className='text-center capitalize text-white-500'>no data found</div>
          }
        </div>
      }
    </div>
  );
}

// {/* Loading state */}
// {loading && (
//   <div className="space-y-4">
//     <Loading variant="skeleton" className="h-[140px]" />
//     <Loading variant="skeleton" className="h-[420px]" />
//   </div>
// )}

// {/* Error state */}
// {!loading && error && (
//   <div className="min-h-50 flex flex-col items-center justify-center gap-3 text-center">
//     <div className="text-error font-medium">{error}</div>
//     <button
//       type="button"
//       onClick={fetchStock}
//       className="btn-secondary"
//       title="Retry"
//     >
//       Retry
//     </button>
//   </div>
// )}

// {/* Empty state */}
// {!loading && !error && !hasData && (
//   <div className="flex items-center justify-center gap-2 text-white-500 flex-col min-h-50 capitalize">
//     <div>No stock found yet.</div>
//     <div>
//       Add a Receipt entry to get started —
//       <NavLink href="/inventory/create" type="link" className="underline text-action ml-1">
//         create inventory receipt
//       </NavLink>
//       .
//     </div>
//     <button
//       type="button"
//       onClick={fetchStock}
//       className="btn-secondary mt-2"
//       title="Refresh"
//     >
//       Refresh
//     </button>
//   </div>
// )}

// {/* Data ready */}
// {!loading && !error && hasData && (
//   <div className="space-y-4">
//     <StockFilters
//       value={filters}
//       onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
//       showTxnType={false}
//     />

//     <StockTable
//       rows={rows}
//       loading={loading}
//       error={error}
//       onRefresh={fetchStock}
//       filters={filters}
//     />
//   </div>
// )}