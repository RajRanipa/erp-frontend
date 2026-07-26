'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Loading from '@/Components/Loading';
import { Toast } from '@/Components/toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { axiosInstance } from '@/lib/axiosInstance';
import LedgerTable from '../components/LedgerTable';
import StockFilters from '../components/StockFilters';

const INITIAL_FILTERS = {
  categoryKey: '',
  productType: '',
  txnType: 'all types',
  warehouseId: '',
  batchNo: '',
  query: '',
};

export default function InventoryMovement() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [limit, setLimit] = useState(200);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const { list: warehouses } = useWarehouses();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filters.query.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const requestFilters = useMemo(() => ({
    categoryKey: filters.categoryKey || undefined,
    productType: filters.productType || undefined,
    txnType: filters.txnType !== 'all types' ? filters.txnType : undefined,
    warehouseId: filters.warehouseId || undefined,
    batchNo: filters.batchNo || undefined,
    search: debouncedQuery || undefined,
  }), [
    filters.categoryKey,
    filters.productType,
    filters.txnType,
    filters.warehouseId,
    filters.batchNo,
    debouncedQuery,
  ]);

  const fetchLedger = useCallback(async ({ append = false, nextCursor = null } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/api/inventory/ledger', {
        params: {
          ...requestFilters,
          limit,
          cursor: append ? nextCursor : undefined,
        },
      });
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setRows(current => append ? [...current, ...list] : list);
      setCursor(response?.data?.nextCursor || null);
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to load movements';
      setError(message);
      Toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, requestFilters]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <StockFilters
        title="Stock movements"
        value={filters}
        onChange={patch => setFilters(current => ({ ...current, ...patch }))}
        onRefresh={() => fetchLedger()}
        loading={loading}
        warehouses={warehouses}
      />

      {loading ? (
        <Loading variant="skeleton" className="flex-1" />
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-error">{error}</p>
          <button type="button" className="btn-secondary" onClick={() => fetchLedger()}>
            Retry
          </button>
        </div>
      ) : (
        <LedgerTable
          rows={rows}
          filters={{ query: filters.query, serverSearch: true }}
          limit={limit}
          onLimitChange={setLimit}
          hasMore={Boolean(cursor)}
          onLoadMore={() => fetchLedger({ append: true, nextCursor: cursor })}
          loadingMore={loadingMore}
        />
      )}
    </div>
  );
}
