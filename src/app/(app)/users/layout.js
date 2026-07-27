// src/app/(app)/users/page.js
'use client';
import React from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';

export default function UsersPage({ children }) {
    const { can, isOwner } = useAuthz();
    return (
        <>
            <DisplayBar title="Users" href="/users">
                <div className='w-full flex items-center justify-between'>
                    <div className="flex items-center gap-2">
                        {(isOwner || can(['users:invite:read'])) && <NavLink href="/users/invite" type="link">Invitations</NavLink>}
                    </div>
                </div>
            </DisplayBar>
            <DisplayMain>
                {children}
            </DisplayMain>
        </>
    );
}
