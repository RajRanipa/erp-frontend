// src/app/(app)/inventory/page.js
'use client';

import { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import useAuthz from '@/hook/useAuthz';
import NavLink from '@/Components/NavLink';
import Loading from '@/Components/Loading';

export default function InventoryLayout({ children }) {
  const [loading, setLoading] = useState(true); // 'stock' | 'movements' | 'new'
  const { can, mounted } = useAuthz();

  useEffect(() => {
    if (can('inventory:receipt') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) setLoading(false);
  }, [can]);

  return (
    <>
      <DisplayBar title="Inventory" href="/inventory">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className='flex gap-4'>
            <NavLink href="/inventory/stock">Stock</NavLink>
            <NavLink href="/inventory/movements">Movements</NavLink>
          </div>
          <div className='flex gap-2 relative'>
            {loading || can('inventory:receipt') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer') && <Loading variant='skeleton' className='h-7 min-w-[140px]' />}
            {(can('inventory:receipto') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) && (
              <NavLink href="/inventory/create" type='button'>New Movement</NavLink>
            )}
          </div>
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