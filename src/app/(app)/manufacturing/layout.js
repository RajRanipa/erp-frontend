'use client';

import DisplayBar from '@/Components/layout/DisplayBar';
import NavLink from '@/Components/NavLink';
import { ActiveCampaignProvider, useActiveCampaign } from './ActiveCampaignProvider';
import { NavListProvider, useNavList } from './NavListContext';
import React, { useState, useEffect, useRef } from 'react';

// The sticky bar content that reads from context
const NavList = [
    { href: '/manufacturing/campaigns/create', name: 'Start New campaigns' },
]

function ManufacturingBar() {
    const { activeCampaign , campaignList,setActiveCampaign } = useActiveCampaign();
    const { navList } = useNavList();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    return (
        <DisplayBar title="manufacturing" href="/manufacturing" className="overflow-visible">
            <div className="flex relative">
                {activeCampaign && (
                    <div className="flex items-center gap-4">
                        <NavLink
                            href={`/manufacturing/campaigns/view`}
                            type="link"
                        >
                            <div className="flex items-center gap-4">
                                <span className="capitalize">{activeCampaign.name}</span>
                                <span
                                    className={`pointer-events-none text-sm capitalize px-2 py-1 rounded-lg h-fit ${activeCampaign.status.toLowerCase() === "planned"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : activeCampaign.status.toLowerCase() === "running"
                                            ? "bg-blue-100 text-blue-800"
                                            : activeCampaign.status.toLowerCase() === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-secondary text-secondary-text"
                                        }`}
                                >
                                    {activeCampaign.status}
                                </span>
                            </div>
                        </NavLink>
                        <div className='relative' ref={dropdownRef}>
                        {campaignList.length>0 &&<button
                            id="campaign_list"
                            className="flex items-center gap-2 hover:text-most-secondary-text hover:scale-120 transition-transform duration-300"
                            onClick={() => setShowDropdown((prev) => !prev)}
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transform transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>}
                        {showDropdown && campaignList.length>0 && (
                            <div className="absolute right-0 mt-2 w-56 border border-color-100 rounded-lg shadow-lg z-20 bg-black-300 text-secondary-text backdrop-blur-sm ">
                                <div className="py-1">
                                    {campaignList.map((campaign) => (
                                        <button key={campaign.name || campaign._id} className="w-full text-left px-4 py-2 hover:bg-white-100" onClick={() => setActiveCampaign(campaign)}>
                                            <span className="capitalize">{campaign.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
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
        <ActiveCampaignProvider>
            <NavListProvider>
                    <ManufacturingBar />
                    {children}
            </NavListProvider>
        </ActiveCampaignProvider>
    );
}