'use client';

import { useMemo } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { filter1Icon, filter2Icon, searchIcon } from '@/utils/SVG';

const txnTypeOptions = [
  { label: 'All types', value: 'all types' },
  ...['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUST', 'REPACK'].map(value => ({
    label: value,
    value,
  })),
];

const categoryOptions = [
  { label: 'Finished goods', value: 'FG' },
  { label: 'Raw materials', value: 'RAW' },
  { label: 'Packing materials', value: 'PACKING' },
  { label: 'Non-conforming', value: 'NC' },
];

export default function StockFilters({
  title = '',
  value = {},
  onChange,
  className = '',
  showTxnType = true,
  onRefresh,
  loading = false,
  warehouses = [],
}) {
  const filters = {
    warehouseId: value.warehouseId || '',
    batchNo: value.batchNo || '',
    categoryKey: value.categoryKey || '',
    productType: value.productType || '',
    query: value.query || '',
    txnType: showTxnType ? value.txnType || 'all types' : '',
  };
  const emit = patch => onChange?.(patch);
  const warehouseOptions = useMemo(
    () => warehouses.map(warehouse => ({
      value: String(warehouse._id),
      label: warehouse.name,
    })),
    [warehouses],
  );

  const clear = () => emit({
    warehouseId: '',
    batchNo: '',
    categoryKey: '',
    productType: '',
    query: '',
    txnType: showTxnType ? 'all types' : '',
  });

  return (
    <div className={`flex flex-wrapitems-start justify-between gap-3 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold capitalize text-nowrap text-secondary-text mb-5">
          {title}
        </h3>
      )}
      <div className="flex items-start gap-3">
        <SelectTypeInput
          name="categoryKey"
          placeholder="Item category"
          value={filters.categoryKey}
          onChange={event => emit({
            categoryKey: event.target.value,
            productType: '',
          })}
          options={categoryOptions}
          className="min-w-[150px]"
        />

        {(!filters.categoryKey || filters.categoryKey === 'FG') && (
          <SelectTypeInput
            name="productType"
            placeholder="Product Type"
            value={filters.productType}
            onChange={event => emit({ productType: event.target.value })}
            apiget="/api/product-type/options"
            icon={filter1Icon()}
          />
        )}

        {warehouseOptions.length > 1 && <SelectTypeInput
          name="warehouseId"
          placeholder="Warehouse"
          value={filters.warehouseId}
          onChange={event => emit({ warehouseId: event.target.value })}
          options={warehouseOptions}
          className="min-w-[150px]"
        />}

        {showTxnType && (
          <SelectTypeInput
            name="txnType"
            value={filters.txnType}
            placeholder="Movement type"
            onChange={event => emit({ txnType: event.target.value })}
            options={txnTypeOptions}
            className="min-w-[120px]"
            icon={filter2Icon()}
          />
        )}

        {false && <CustomInput
          name="batchNo"
          parent_className="mb-5 max-w-[180px]"
          placeholder="Batch number"
          value={filters.batchNo}
          onChange={event => emit({ batchNo: event.target.value })}
        />}

        <CustomInput
          name="inventorySearch"
          type="search"
          parent_className="mb-5"
          className="min-w-[240px]"
          placeholder="Search Item, SKU, grade…"
          value={filters.query}
          onChange={event => emit({ query: event.target.value })}
          icon={searchIcon()}
        />

        <button type="button" onClick={clear} className="btn-secondary mb-5">
          Clear
        </button>
        {onRefresh && (
          <button
            type="button"
            className="text-sm underline mb-5 px-2 py-2"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        )}
      </div>
    </div>
  );
}
