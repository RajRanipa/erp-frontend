// src/app/(app)/parties/layout.js
'use client';

import { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import useAuthz from '@/hooks/useAuthz';
import NavLink from '@/Components/NavLink';
import Loading from '@/Components/Loading';
import { addIcon } from '@/utils/SVG';

export default function InventoryLayout({ children }) {
  const [loading, setLoading] = useState(true); // 'stock' | 'movements' | 'new'
  const { can, mounted } = useAuthz();

  useEffect(() => {
    if (can('inventory:receipt') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) setLoading(false);
  }, [can]);

  return (
    <>
      <DisplayBar title="Parties" href="/parties">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className='flex gap-4'>
            
          </div>
          <div className='flex gap-2 relative'>
            {/* {loading || can('inventory:receipt') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer') && <Loading variant='skeleton' className='h-7 min-w-[140px]' />} */}
            {
              <NavLink href="/parties/new" type='button' className='flex items-center gap-2'>{addIcon()} New Party</NavLink>
            }
          </div>
        </div>
      </DisplayBar>

      <DisplayMain>
          {/* <div> */}
        {children ?? 
            'Inventory Page is in production'
        }
          {/* </div> */}
      </DisplayMain>
    </>
  );
}