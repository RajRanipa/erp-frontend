// src/app/(app)/inventory/page.js
'use client';

import { useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import { Toast } from '@/Components/toast';
import useAuthz  from '@/hook/useAuthz';

import StockFilters from './components/StockFilters';
import StockTable from './components/StockTable';
import LedgerTable from './components/LedgerTable';
import MovementForm from './components/MovementForm';
import TransferForm from './components/TransferForm';
import NavLink from '@/Components/NavLink';

export default function InventoryPage({children}) {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements' | 'new'
  const [filters, setFilters] = useState({ itemId: '', warehouseId: '', batchNo: '' });

  const { can, mounted } = useAuthz();



  return (
    <>
      <DisplayBar title="Inventory" href="/inventory">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className='flex gap-4'>
          <NavLink href="/inventory/stock">Stock</NavLink>
          <NavLink href="/inventory/movements">Movements</NavLink>
          </div>
          { (can('inventory:receive') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) && (
            <NavLink href="/inventory/create" type='button'>New Movement</NavLink>
          )}
        </div>
      </DisplayBar>

      <DisplayMain>
          {children ?? (
            <div>
              Inventory Page is in production
            </div>
          )}
      </DisplayMain>
    </>
  );
}