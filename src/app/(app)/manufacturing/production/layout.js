// src/app/items/page.js 
'use client';
import React, { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from "@/Components/toast";
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';
import Loading from '@/Components/Loading';
export default function Production({ children }) {
  
  const { can } = useAuthz();
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
        if (can('production:read')) setLoading(false);
    }, [can]);
    
  return (
    <>
      <div className='flex flex-1 flex-col grow h-[stretch]'>
      <div className='flex gap-4 items-center p-1'>
      <div className='flex gap-4 items-center mb-2 py-2 px-3 bg-white-100 rounded w-full'>
        {loading || !can('production:read') && <Loading variant='skeleton' className='h-7 min-w-[140px]'/>}
        {can('production:read') && (<div className="flex gap-4">
          {can('production:read') && <NavLink
            href="/manufacturing/production/day"
            className="cursor-pointer"
            // onClick={() => setFilterType('finished')}
          >
            day
          </NavLink>}
          {can('production:read') && <NavLink
            href="/manufacturing/production/night"
            // onClick={() => setFilterType('raw')}
          >
            night
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