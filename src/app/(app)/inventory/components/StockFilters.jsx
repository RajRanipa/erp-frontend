'use client';
// src/app/(app)/inventory/components/StockFilters.jsx
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import CustomInput from '@/Components/inputs/CustomInput';
import { filter1Icon, filter2Icon, searchIcon } from '@/utils/SVG';
import { useHighlight } from '@/hooks/useHighlight';
import { useEffect } from 'react';

/**
 * StockFilters (fully controlled)
 *
 * Props:
 * - value: {
 *     itemId?: string,
 *     warehouseId?: string,
 *     batchNo?: string,
 *     productType?: string,
 *     query?: string,
 *     txnType?: string,
 *   }
 * - onChange: (patch) => void   // we only emit the patch, parent merges
 * - className?: string
 * - showTxnType?: boolean       // NEW: hide txnType when false
 */

const txnTypeOptions = [
  { label: 'All Types', value: 'all types' },
  { label: 'RECEIPT', value: 'RECEIPT' },
  { label: 'ISSUE', value: 'ISSUE' },
  { label: 'TRANSFER', value: 'TRANSFER' },
  { label: 'ADJUST', value: 'ADJUST' },
  { label: 'REPACK', value: 'REPACK' },
];

export default function StockFilters({
  title = '',
  value = {},
  onChange,
  className = '',
  showTxnType = true,
  onRefresh = () => {},
  loading = false,
  StockFiltersRef = () => {},
}) {
  const filters = {
    itemId: value.itemId || '',
    warehouseId: value.warehouseId || '',
    batchNo: value.batchNo || '',
    productType: value.productType || '',
    query: value.query || '',
    txnType: showTxnType ? (value.txnType || 'all types') : (value.txnType || ''),
    serverSearch: value.serverSearch ?? true,
  };
  // parent merge
  const emit = (patch) => {
    onChange?.(patch, "it's from stock filters");
  };

  const handleProductTypeChange = (e) => {
    const v = e?.target?.value ?? '';
    emit({ productType: v });
  };

  const handleTxnTypeChange = (e) => {
    const v = e?.target?.value ?? '';
    if (!showTxnType) return;
    if (v === filters.txnType) return;
    emit({ txnType: v });
  };

  const r = useHighlight(filters.query);

  useEffect(() => {
    StockFiltersRef(r);
  }, [r, StockFiltersRef]);

  const handleQueryChange = (e) => {
    emit({ query: e.target.value });
  };

  const clear = () => {
    const patch = {
      itemId: '',
      warehouseId: '',
      batchNo: '',
      productType: '',
      query: '',
      txnType: showTxnType ? 'all types' : '',
    };
    onChange?.(patch, "it's from stock filters");
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      {title && <h3 className="text-lg font-semibold capitalize text-nowrap text-secondary-text mb-5">{title}</h3>}
      <div className="flex items-center gap-3 flex-0">
        {/* Product Type */}
        <SelectTypeInput
          name="productType"
          id="productType"
          placeholder="Product Type"
          value={filters.productType}
          onChange={handleProductTypeChange}
          apiget="/api/product-type"
          icon={filter1Icon()}
        />

        {/* Txn type (optional) */}
        {showTxnType && (
          <SelectTypeInput
            name="txnType"
            value={filters.txnType}
            placeholder="Txn Type"
            onChange={handleTxnTypeChange}
            options={txnTypeOptions}
            className="min-w-[120px]"
            icon={filter2Icon()}
          />
        )}

        {/* Client-side search */}
        <CustomInput
          type="search"
          parent_className="mb-5"
          className="min-w-[260px]"
          placeholder="Search: temp / density / size / packing"
          value={filters.query}
          onChange={handleQueryChange}
          icon={searchIcon()}
        />

        

        <button
          type="button"
          onClick={clear}
          className="btn-secondary mb-5"
          title="Clear filters"
        >
          Clear
        </button>
        {onRefresh && (
          <button className="text-sm underline mb-5" onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        )}
      </div>
    </div>
  );
}