// src/app/(app)/users/page.js
'use client';
import React from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';

export default function UsersPage({ children }) {
    return (
        <>
            <DisplayBar title="Users" href="/users">
                <div className='w-full flex items-center justify-between'>
                    <div className="flex items-center gap-2">
                        <NavLink href="/users/invite" type="link" >invite users</NavLink>
                    </div>
                </div>
            </DisplayBar>
            <DisplayMain>
                {children}
            </DisplayMain>
        </>
    );
}