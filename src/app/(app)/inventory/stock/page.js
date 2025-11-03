'use client';
// src/app/(app)/inventory/stock/page.js
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState, memo } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import Inventory from '../page';
import { Toast } from '@/Components/toast';
import StockFilters from '../components/StockFilters';
import StockTable from '../components/StockTable';


export default function InventoryStock() {
  const [filters, setFilters] = useState({ itemId: '', warehouseId: '', batchNo: '', productType: '', query: '', });
  return (
    <Inventory>
      <div className="space-y-4">
        <StockFilters
          value={filters}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          showTxnType={false}
        />
        <StockTable filters={filters} onFiltersChange={setFilters} />
      </div>
    </Inventory>
  );
}