// src/app/items/page.js 
'use client';
import React, { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from "@/Components/toast";
import useAuthz from '@/hook/useAuthz';
import { addIcon } from '@/utils/SVG';
import Loading from '@/Components/Loading';
export default function Items({ children }) {
  
  const { can } = useAuthz();
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
        if (can('items:create')) setLoading(false);
    }, [can]);
    
  return (
    <>
      <DisplayBar title="Items" href="/items">
        <div className="flex gap-4">
          <NavLink
            href="/items/finished"
            className="cursor-pointer"
            // onClick={() => setFilterType('finished')}
          >
            Finished Goods
          </NavLink>
          <NavLink
            href="/items/raw"
            // onClick={() => setFilterType('raw')}
          >
            Raw Material
          </NavLink>
          <NavLink
            href="/items/packing"
            // onClick={() => setFilterType('packing')}
          >
            Packing Material
          </NavLink>
        </div>
        <div className='flex gap-2 relative'>
          {loading || !can('items:create') && <Loading variant='skeleton' className='h-7 min-w-[140px]'/>}
          {can('items:create') && (
            <NavLink href="/items/create" type={"button"}><span className='flex items-center gap-2'> {addIcon()} Create Item </span></NavLink>
          ) 
          }
        </div>
      </DisplayBar>
      <DisplayMain>
        {children}
      </DisplayMain>
    </>
  );
}