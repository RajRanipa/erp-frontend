// src/components/layout/Topbar.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from "@/context/UserContext";
import { cn } from '@/utils/cn';
import { logoutIcon } from '@/utils/SVG';
import Loading from '../Loading';
import LogOutBtn from '../buttons/LogOutBtn';

const Topbar = ({ setOpen = () => { }, open }) => {
  const { userName, companyName } = useUser() || {};
  // let userName = "John Doe";
  // let companyName = "ABC Company";

  // Derive a stable display label (only after mount to avoid SSR mismatch)
  const userlogo = useMemo(() => {
    if (!userName) return '';
    return userName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  }, [userName]);

  const cName = useMemo(() => {
    if (!companyName) return '';
    return companyName
  }, [companyName]);
  console.log("open", open, "userlogo", userlogo, "cName", cName)
  return (
    <header className="min-h-12 min-w-screen bg-primary z-10 flex items-center px-2 lg:px-5 justify-between top-0">
    { (cName && userlogo) ? <>
      <div className='flex items-center gap-3'>
        <button
          className={cn('lg:hidden btn-ghost flex items-center justify-center')}
          onClick={() => setOpen(prev => !prev)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-primary-text hover:bg-actionHover capitalize">{cName}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Notification icon, user avatar, etc */}
        <span>🔔</span>
        <button className='btn-ghost flex items-center justify-center'>
          <span className="text-secondary-text capitalize">
            {userlogo}
          </span>
        </button>
        <LogOutBtn/>
      </div>
    </> :
    <Loading variant="skeleton" className='h-10'/>
    }
    </header>
  );
};

export default Topbar;