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
export default function Parameters({ children }) {
  
  const { can } = useAuthz();
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
        if (can('parameters:read')) setLoading(false);
    }, [can]);
    
  return (
    <>
      <div className='flex flex-1 flex-col grow h-[stretch]'>
      <h3 className="text-xl font-bold mb-2 capitalize">you can manage your parameters here</h3>
      <div className='flex gap-4 items-center p-1'>
      <div className='flex gap-4 items-center mb-2 py-2 px-3 bg-white-100 rounded w-full'>
        {loading || !can('parameters:read') && <Loading variant='skeleton' className='h-7 min-w-[140px]'/>}
        {can('parameters:read') && (<div className="flex gap-4">
          {can('parameters:categories:read') && <NavLink
            href="/items/parameters/catagory"
            className="cursor-pointer"
            // onClick={() => setFilterType('finished')}
          >
            catagory
          </NavLink>}
          {can('parameters:producttypes:read') && <NavLink
            href="/items/parameters/producttype"
            // onClick={() => setFilterType('raw')}
          >
            product type
          </NavLink>}
          {can('parameters:densities:read') && <NavLink
            href="/items/parameters/densites"
            // onClick={() => setFilterType('raw')}
          >
            density
          </NavLink>}
          {can('parameters:temperatures:read') && <NavLink
            href="/items/parameters/temperatures"
            // onClick={() => setFilterType('raw')}
          >
            temperature
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