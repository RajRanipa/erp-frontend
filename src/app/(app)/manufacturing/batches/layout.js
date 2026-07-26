// src/app/manufacturing/page.js 
'use client';
import React, { useEffect, useState } from 'react';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';
import Loading from '@/Components/Loading';
export default function Batches({ children }) {
  
  const { can } = useAuthz();
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
        if (can('batches:read')) setLoading(false);
    }, [can]);
    
  return (
    <>
      <div className='flex flex-1 flex-col grow h-[stretch]'>
      <div className='flex gap-4 items-center p-1'>
      <div className='flex gap-4 items-center mb-2 py-2 px-3 bg-white-100 rounded w-full'>
        {loading || !can('batches:read') && <Loading variant='skeleton' className='h-7 min-w-[140px]'/>}
        {can('batches:read') && (<div className="flex gap-4">
          {can('batches:categories:read') && <NavLink
            href="/manufacturing/batches/view"
            className="cursor-pointer flex gap-1 items-end"
            // onClick={() => setFilterType('finished')}
          >
            view
            <span className='text-sm text-white-300'>Past Batches</span>
          </NavLink>}
          {can('batches:read') && <NavLink
            href="/manufacturing/batches/create"
            // onClick={() => setFilterType('raw')}
          >
            create
          </NavLink>}
        </div>)}
      </div>
      </div>
      <div className='flex w-full flex-1 overflow-auto p-1'>
        {children}
      </div>
      </div>
    </>
  );
}