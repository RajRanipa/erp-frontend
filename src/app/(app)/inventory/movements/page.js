'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Inventory from '../page';
import StockFilters from '../components/StockFilters';
import LedgerTable from '../components/LedgerTable';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Loading from '@/Components/Loading';

export default function InventoryMovement() {
  const defaultFilters = useMemo(
    () => ({
      itemId: '',
      productType: '',
      txnType: 'all types',
      warehouseId: '',
      batchNo: '',
      query: '',
      serverSearch: false,
    }),
    []
  );

  const [filters, setFilters] = useState(defaultFilters);
  const [rows, setRows] = useState([]);
  const [limit, setLimit] = useState(200); // per-page server limit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null); // for pagination (older than this date)
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(null); // optional external ref for LedgerTable

  // toggle between shallow (client search) vs deep server search
  // const [serverSearch, setServerSearch] = useState(false);

  // default window for shallow mode: last 30 days
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);


  const fetchLedger = useCallback(
    async ({ reset = false, useFilters, useCursor } = {}) => {
      setLoading(true);
      setError('');
      try {
        const params = { limit };
        const f = useFilters;
        const useServerSearch = !!(f && f.serverSearch);

        if (useServerSearch) {
          if (f.query) params.q = f.query;
          if (f.productType) params.productType = f.productType;
          if (f.txnType && f.txnType !== 'all types') params.txnType = f.txnType;
        } else {
          params.from = defaultFrom;
          if (f.productType) params.productType = f.productType;
          if (f.txnType && f.txnType !== 'all types') params.txnType = f.txnType;
        }

        if (!reset && useCursor) params.cursor = useCursor;

        const res = await axiosInstance.get('/api/inventory/ledger', { params });
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const next = res?.data?.nextCursor || null;

        setRows(prev => reset ? list : [...prev, ...list]);
        setCursor(next);
        setHasMore(Boolean(next));
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to load movements';
        setError(msg);
        Toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [limit, defaultFrom]
  );

  useEffect(() => {
    setCursor(null);
    fetchLedger({
      reset: true,
      useFilters: filters,
      useCursor: null
    });
  }, [filters.serverSearch, limit, fetchLedger]);

useEffect(() => {
  if (!filters.serverSearch) return; // only react live when deep search is ON
  setCursor(null);
  fetchLedger({
    reset: true,
    useFilters: filters,
    useCursor: null,
  });
}, [filters.query, filters.productType, filters.txnType, fetchLedger]);

  const handleFiltersChange = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const hasData = rows && rows.length > 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Loading state */}
      {loading && (
        <div className="space-y-4 h-full flex flex-col gap-2">
          <Loading variant="skeleton" className="h-[40px]" />
          <Loading variant="skeleton" className="flex-1" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="min-h-50 flex flex-col items-center justify-center gap-3 text-center">
          <div className="text-error font-medium">{error}</div>
          <button
            type="button"
            onClick={() => fetchLedger({ reset: true, useFilters: filters, useCursor: null })}
            className="btn-secondary"
            title="Retry"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data / empty state */}
      {!loading && !error && (
        hasData ? (
          <>
            <StockFilters
              title="Stock Movements"
              value={filters}
              onChange={handleFiltersChange}
              loading={loading}
              onRefresh={() => fetchLedger({ reset: true, useFilters: filters, useCursor: null })}
              StockFiltersRef={setRefresh}
            />

            <LedgerTable
              rows={rows}
              loading={loading}
              error={error}
              filters={filters}
              limit={limit}
              onLimitChange={setLimit}
              hasMore={hasMore}
              onLoadMore={() => fetchLedger({ reset: false, useFilters: filters, useCursor: cursor })}
              refrence={refresh}
              serverSearch={filters.serverSearch}
            />
          </>
        ) : (
          <div className="text-center capitalize text-white-500">no data found</div>
        )
      )}
    </div>
  );
}