'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';

export default function InventoryLayout({ children }) {
  return (
    <>
      <DisplayBar title="Inventory" href="/inventory">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className="flex gap-4">
            <NavLink href="/inventory/control">Inventory Control</NavLink>
            <NavLink href="/inventory/operations">Operations</NavLink>
            <NavLink href="/inventory/serials">Serial Registry</NavLink>
          </div>
        </div>
      </DisplayBar>

      <DisplayMain>{children ?? 'Inventory'}</DisplayMain>
    </>
  );
}
