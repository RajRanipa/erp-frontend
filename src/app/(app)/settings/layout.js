// src/app/items/page.js 
'use client';
import React from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';

export default function SettingLayout({ children }) {
  
  const { can, isOwner } = useAuthz();
  const canManageRoles = isOwner || (can('roles:read') && can('permissions:read'));
    
  return (
    <>
      <DisplayBar title="Settings" href="/settings">
        <div className="flex gap-4">
          <NavLink
            href="/settings/myaccount"
            className="cursor-pointer"
          >
            My Account
          </NavLink>
          {canManageRoles && <NavLink
            href="/settings/role&permisstions"
            className="cursor-pointer"
          >
            Roles &amp; Permissions
          </NavLink>
          }
        </div>
        <div className='flex gap-2 relative'>
          
        </div>
      </DisplayBar>
      <DisplayMain>
        {children}
      </DisplayMain>
    </>
  );
}
