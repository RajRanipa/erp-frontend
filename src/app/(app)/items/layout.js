'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';

export default function ItemsLayout({ children }) {
  const { can } = useAuthz();

  return (
    <>
      <DisplayBar title="Items" href="/items">
        <nav className="flex gap-4" aria-label="Item categories">
          <NavLink href="/items/catalog">Item Master</NavLink>
        </nav>

        <div className="flex gap-2">
          {can('items:create') && (
            <NavLink href="/items/catalog/create" type="button">
              <span className="flex items-center gap-2">
                {addIcon()} Create Item
              </span>
            </NavLink>
          )}
        </div>
      </DisplayBar>

      <DisplayMain>{children}</DisplayMain>
    </>
  );
}
