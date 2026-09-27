'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';

export default function ManufacturingLayout({ children }) {
  const { can } = useAuthz();

  return (
    <>
      <DisplayBar title="Manufacturing" href="/manufacturing">
        <nav className="flex items-center gap-5" aria-label="Manufacturing sections">
          {can('campaigns:read') ? <NavLink href="/manufacturing/campaigns" matchPrefix>Campaigns</NavLink> : null}
          {can('production:read') ? <NavLink href="/manufacturing/orders" matchPrefix>Production Orders</NavLink> : null}
          {can('production:read') ? <NavLink href="/manufacturing/recipes" matchPrefix>Recipes</NavLink> : null}
          {can('production:create') ? <NavLink href="/manufacturing/chopping" matchPrefix>Chopping</NavLink> : null}
        </nav>
        <div>
          {can('campaigns:create') ? (
            <NavLink href="/manufacturing/campaigns/create" type="button">
              Start Campaign
            </NavLink>
          ) : null}
        </div>
      </DisplayBar>
      <DisplayMain>{children}</DisplayMain>
    </>
  );
}
