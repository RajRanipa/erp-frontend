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

export default function SettingLayout({ children }) {
  
  const { can } = useAuthz();
  const [loading, setLoading] = useState(false);
    
    
  return (
    <>
      <DisplayBar title="Settings" href="/settings">
        <div className="flex gap-4">
        
          {can('users:permissions:create') && <NavLink
            href="/settings/role&permisstions"
            className="cursor-pointer"
            // onClick={() => setFilterType('finished')}
          >
            role & permisstions
          </NavLink>
          }

        </div>
        <div className='flex gap-2 relative'>
          
        </div>
      </DisplayBar>
      <DisplayMain>
        {children}
      </DisplayMain>
    </>
  );
}