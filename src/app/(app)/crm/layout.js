'use client';

import DisplayBar from '@/components/layout/DisplayBar';
import NavLink from '@/components/NavLink';
// import { ActiveCampaignProvider, useActiveCampaign } from './ActiveCampaignProvider';
import { NavListProvider, useNavList } from './NavListContext';
import { ActivePartyProvider, useActiveParty } from './ActivePartyProviser';
import { use, useEffect } from 'react';

function CRMBar() {
    // const { activeCampaign } = useActiveCampaign();
    const { navList } = useNavList();
    const { activeParty } = useActiveParty();
    useEffect(() => {
        console.log("[CRMBar] activeParty updated:", activeParty);
    }, [activeParty]);

    return (
        <DisplayBar title="CRM" href="/crm">
            <div className="flex">
                {activeParty ? (
                    <div className="flex items-center gap-4">
                        <NavLink
                            href={`/crm/parties`}
                            type="link"
                        >
                            <p className="flex items-center gap-4">
                                <span className="capitalize">{activeParty.displayName || activeParty.legalName || 'Party'}</span>
                                {activeParty.status && (
                                    <span
                                        className={`pointer-events-none text-sm capitalize px-2 py-1 rounded-lg h-fit ${(() => {
                                            const s = String(activeParty.status || '').toLowerCase();
                                            if (s === 'active') return 'bg-green-100 text-green-800';
                                            if (s === 'inactive') return 'bg-gray-200 text-gray-700';
                                            if (s === 'prospect') return 'bg-yellow-100 text-yellow-800';
                                            return 'bg-secondary text-secondary-text';
                                        })()}`}
                                    >
                                        {activeParty.status}
                                    </span>
                                )}
                            </p>
                        </NavLink>
                    </div>
                ) : (
                    <NavLink
                        href={`/crm/parties`}
                        type="button">parties</NavLink>
                )}

            </div>
            <div className='flex items-center gap-2'>
                {navList.map((item) => (
                    <NavLink key={item.href} href={item.href} type={"button"}>
                        {item.name}
                    </NavLink>
                ))}
            </div>
        </DisplayBar>
    );
}

export default function ManufacturingLayout({ children }) {
    return (
        <ActivePartyProvider>
            <NavListProvider>
                {/* <DisplayMain> */}
                <CRMBar />
                {children}
                {/* </DisplayMain> */}
            </NavListProvider>
        </ActivePartyProvider>
    );
}