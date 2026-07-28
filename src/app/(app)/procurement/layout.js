'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';

export default function ProcurementLayout({ children }) {
  const { can } = useAuthz();
  return (
    <>
      <DisplayBar title="Procurement" href="/procurement">
        <div className="flex w-full items-center justify-between gap-4">
          <nav className="flex items-center gap-4 overflow-x-auto">
            <NavLink href="/procurement">Overview</NavLink>
            <NavLink href="/procurement/orders">Orders</NavLink>
            <NavLink href="/procurement/receipts">Goods receipts</NavLink>
            <NavLink href="/procurement/returns">Returns</NavLink>
            <NavLink href="/procurement/invoices">Invoices</NavLink>
          </nav>
          {can('procurement:create') && (
            <NavLink href="/procurement/orders/new" type="button">
              + New purchase order
            </NavLink>
          )}
        </div>
      </DisplayBar>
      <DisplayMain>{children}</DisplayMain>
    </>
  );
}
