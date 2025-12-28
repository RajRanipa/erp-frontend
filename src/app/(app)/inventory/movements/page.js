'use client';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
        const f = useFilters || {};

        // Always keep a sane default range (last 30 days). User can load older via cursor.
        params.from = defaultFrom;

        if (f.productType) params.productType = f.productType;
        if (f.txnType && f.txnType !== 'all types') params.txnType = f.txnType;

        if (!reset && useCursor) params.cursor = useCursor;
        console.log('fetchLedger', params);
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
      useCursor: null,
    });
  }, [limit, filters.serverSearch, fetchLedger]);

  const handleFiltersChange = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  return (
    <>
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
          <>
            <StockFilters
              title="Stock Movements"
              value={filters}
              onChange={handleFiltersChange}
              loading={loading}
              onRefresh={() => fetchLedger({ reset: true, useFilters: filters, useCursor: null })}
              hasMore={hasMore}
              onLoadMore={() => fetchLedger({ reset: false, useFilters: filters, useCursor: cursor })}
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
              serverSearch={filters.serverSearch}
            />
          </>
        )}
      </div>
    </>
  );
}