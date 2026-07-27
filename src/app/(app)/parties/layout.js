'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';

export default function PartiesLayout({ children }) {
  const { can } = useAuthz();
  const canWrite = can('parties:write');
  return (
    <>
      <DisplayBar title="Business Partners" href="/parties">
        <div className="flex items-center justify-end w-full">
          {canWrite && (
            <NavLink href="/parties/new" type="button" className="flex items-center gap-2">
              {addIcon()} New Business Partner
            </NavLink>
          )}
        </div>
      </DisplayBar>
      <DisplayMain>{children}</DisplayMain>
    </>
  );
}
