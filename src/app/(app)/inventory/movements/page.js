// frontend-erp/src/app/(app)/inventory/movements/page.js
'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Inventory from '../page';
import StockFilters from '../components/StockFilters';
import LedgerTable from '../components/LedgerTable';

export default function InventoryMovement() {
  // stable initial filters
  const defaultFilters = useMemo(() => ({
    itemId: '',
    productType: '',
    txnType: 'all types', // must match Select option values
    warehouseId: '',
    batchNo: '',
    query: '',
  }), []);

  const [filters, setFilters] = useState(defaultFilters);

  // merge helper for children
  const handleFiltersChange = (patch, from) => {
    // console.log("from", from);
    // console.log("patch", patch);
    setFilters((prev) => ({
      ...prev,
      ...patch,
    }));
    // console.log("filters from movements :- ", filters);
  };

  useEffect(() => {
    // console.log("defaultFilters :- ",defaultFilters);
  }, [defaultFilters]);

  return (
    <Inventory>
      <div className="space-y-4">
        <StockFilters value={filters} onChange={handleFiltersChange} />
        <LedgerTable filters={filters} onFiltersChange={handleFiltersChange} />
      </div>
    </Inventory>
  );
}