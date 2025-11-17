// src/components/layout/Topbar.jsx
'use client';

import React, { useMemo } from 'react';
import { useUser } from "@/context/UserContext";
import { cn } from '@/utils/cn';
import { logoutIcon } from '@/utils/SVG';
import Loading from '../Loading';
import LogOutBtn from '../buttons/LogOutBtn';

const Topbar = ({ setOpen = () => { }, open }) => {
  const { userName, companyName } = useUser() || {};

  const userlogo = useMemo(() => {
    if (!userName) return '';
    return userName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  }, [userName]);

  const cName = companyName || '';

  const hasIdentity = Boolean(cName && userlogo);

  return (
    <header className="min-h-12 min-w-screen bg-primary z-10 flex items-center px-2 lg:px-5 justify-between top-0">
    {hasIdentity ? (
      <>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={cn('lg:hidden btn-ghost flex items-center justify-center')}
            onClick={() => setOpen(prev => !prev)}
            aria-label={open ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={open ? 'true' : 'false'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
              />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-primary-text hover:bg-actionHover capitalize">
            {cName}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="btn-ghost flex items-center justify-center"
            aria-label="Notifications"
          >
            <span>🔔</span>
          </button>
          <button
            className="btn-ghost flex items-center justify-center"
            aria-label={`Account for ${userName || 'user'}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
              {userlogo || 'U'}
            </span>
          </button>
          <LogOutBtn />
        </div>
      </>
    ) : (
      <Loading variant="skeleton" className="h-10 w-full" />
    )}
    </header>
  );
};

export default Topbar;