// src/components/layout/Topbar.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from "@/context/UserContext";

const Topbar = () => {
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
  }, [ userName]);

  const cName = useMemo(() => {
    if ( !companyName) return '';
    return companyName
  }, [ companyName]);

  return (
    <header className="min-h-16 min-w-screen bg-primary z-10 flex items-center px-6 justify-between top-0">
      <h1 className="text-lg font-medium text-primary-text hover:bg-actionHover capitalize">{cName}</h1>
      <div className="flex items-center gap-4">
        {/* Notification icon, user avatar, etc */}
        <span>🔔</span>
        <button className='btn-ghost'>
          <span className="text-secondary-text capitalize">
            {userlogo}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;