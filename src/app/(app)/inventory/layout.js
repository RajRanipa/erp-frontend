'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';

const MOVEMENT_PERMISSIONS = [
  'inventory:receipt',
  'inventory:issue',
  'inventory:adjust',
  'inventory:transfer',
  'inventory:reserve',
  'inventory:repack',
];

export default function InventoryLayout({ children }) {
  const { can } = useAuthz();
  const canCreateMovement = MOVEMENT_PERMISSIONS.some(permission => can(permission));

  return (
    <>
      <DisplayBar title="Inventory" href="/inventory">
        <div className="flex gap-2 items-center justify-between w-full">
          <div className="flex gap-4">
            <NavLink href="/inventory/stock">Stock</NavLink>
            <NavLink href="/inventory/movements">Movements</NavLink>
          </div>
          {canCreateMovement && (
            <NavLink href="/inventory/create" type="button" className="flex items-center gap-2">
              {addIcon()} New Movement
            </NavLink>
          )}
        </div>
      </DisplayBar>

      <DisplayMain>{children ?? 'Inventory'}</DisplayMain>
    </>
  );
}
