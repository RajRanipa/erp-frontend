// src/app/(app)/inventory/layout.js 
// (Note: Usually components taking 'children' in Next.js are layout.js, not page.js)
'use client';

import React, { useEffect, useState, createContext, useContext } from 'react'; // <-- Import Context hooks
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import useAuthz from '@/hooks/useAuthz';
import NavLink from '@/Components/NavLink';
import DateInput from '@/Components/inputs/DateInput';

// 1. Create and Export the Context
export const DateRangeContext = createContext(null);

// Optional: Create a custom hook for easier importing later
export const useDateRange = () => useContext(DateRangeContext);

export default function InventoryLayout({ children }) {
  const [loading, setLoading] = useState(true); 
  const { can, mounted } = useAuthz();
  
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    if (can('inventory:receipt') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) setLoading(false);
  }, [can]);

  return (
    // 2. Wrap everything inside your Context Provider
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      <DisplayBar title="Dashboard" href="/dashboard">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className='flex gap-4'>
            <NavLink href="/dashboard/production">Production</NavLink>
            <NavLink href="/dashboard/sales">Sales</NavLink>
          </div>
          <div className='flex gap-2 relative'>
            <DateInput
              name="date"
              mode="range"
              rangeValues={dateRange}
              onChange={(val) => setDateRange(val)}
              parent_className="mb-0"
            />
          </div>
        </div>
      </DisplayBar>

      <DisplayMain>
          {children ?? 'Dashboard Page is in production'}
      </DisplayMain>
    </DateRangeContext.Provider>
  );
}