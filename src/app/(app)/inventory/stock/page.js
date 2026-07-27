'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '@/Components/Loading';
import NavLink from '@/Components/NavLink';
import { Toast } from '@/Components/toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { axiosInstance } from '@/lib/axiosInstance';
import StockFilters from '../components/StockFilters';
import StockTable from '../components/StockTable';

const INITIAL_FILTERS = {
  warehouseId: '',
  batchNo: '',
  categoryKey: '',
  productType: '',
  query: '',
};

export default function InventoryStock() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const { list: warehouses } = useWarehouses();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filters.query.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const requestFilters = useMemo(() => ({
    warehouseId: filters.warehouseId || undefined,
    batchNo: filters.batchNo || undefined,
    categoryKey: filters.categoryKey || undefined,
    productType: filters.productType || undefined,
    search: debouncedQuery || undefined,
  }), [
    filters.warehouseId,
    filters.batchNo,
    filters.categoryKey,
    filters.productType,
    debouncedQuery,
  ]);

  const fetchStock = useCallback(async ({ append = false, nextCursor = null } = {}) => {
    const requestNumber = ++latestRequest.current;
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/api/inventory/stock', {
        params: {
          ...requestFilters,
          limit: 200,
          cursor: append ? nextCursor : undefined,
        },
      });
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      if (requestNumber !== latestRequest.current) return;
      setRows(current => append ? [...current, ...list] : list);
      setCursor(response?.data?.nextCursor || null);
    } catch (requestError) {
      if (requestNumber !== latestRequest.current) return;
      const message = requestError?.response?.data?.message || 'Failed to load stock';
      setError(message);
      Toast.error(message);
    } finally {
      if (requestNumber === latestRequest.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [requestFilters]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <StockFilters
        title="Current stock"
        value={filters}
        onChange={patch => setFilters(current => ({ ...current, ...patch }))}
        showTxnType={false}
        onRefresh={() => fetchStock()}
        loading={loading}
        warehouses={warehouses}
      />

      {loading ? (
        <Loading variant="skeleton" className="flex-1" />
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-error">{error}</p>
          <button type="button" className="btn-secondary" onClick={() => fetchStock()}>
            Retry
          </button>
        </div>
      ) : rows.length ? (
        <>
          <StockTable rows={rows} search={filters.query} />
          {cursor && (
            <div className="flex justify-center pb-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={loadingMore}
                onClick={() => fetchStock({ append: true, nextCursor: cursor })}
              >
                {loadingMore ? 'Loading…' : 'Load more stock'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-1 text-white-500">
          No stock matches these filters.
          <NavLink href="/inventory/create" type="link" className="underline text-action">
            Post a receipt
          </NavLink>
        </div>
      )}
    </div>
  );
}
