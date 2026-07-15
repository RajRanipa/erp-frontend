// src/app/components/layout/DisplayBar.jsx
"use client";
import React, { Children, use, useCallback, useEffect, useRef, useState } from 'react';
import NavLink from '../NavLink';
import { useRouter } from "next/navigation";
import { cn } from '../../utils/cn';
import Loading from '../Loading';
import { leftArrow } from '@/utils/SVG';

const DisplayBar = ({ title, children, href, className = '' }) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    const hoverTimeout = useRef();
    const handleMouseEnter = useCallback(() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setCollapsed(false), 80);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setCollapsed(true), 80);
    }, []);
    return (
        <>
            <header className={cn(`  border-b min-h-10 border-color-100 flex shadow-sm z-9 items-center gap-4 p-1.5 top-0 w-full bg-secondary text-secondary-text justify-between ${className}`)}>
                <div className='flex gap-2 border-r-2 border-gray-500 pr-4 items-center'>
                    <button onClick={() => router.back()} className='cursor-pointer transition-transform duration-300 hover:-translate-x-1 text-primary-text hover:text-secondary-text text-2xl'>
                        {leftArrow()}
                    </button>
                    <NavLink
                        href={href}
                        type="link"
                        className='text-nowrap capitalize text-lg font-medium'
                    >
                        {title}
                    </NavLink>
                </div>
                <button
                    type="button"
                    className={cn('lg:hidden btn-ghost flex items-center justify-center float-end')}
                    onClick={() => setOpen(prev => !prev)}
                    aria-label={open ? 'Close sidebar_right' : 'Open sidebar_right'}
                    aria-expanded={open ? 'true' : 'false'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                        />
                    </svg>
                </button>
                <div className="hidden lg:flex items-center justify-between gap-4 w-full">
                    {children}
                </div>
                {/* <div className="flex-col lg:hidden items-center justify-between gap-4 w-full"> */}
                <aside
                    role="complementary_right"
                    aria-label="Sidebar_right"
                    className={cn(
                        // base
                        'lg:hidden',
                        'lg:bg-primary text-primary-text max-h-full overflow-hidden lg:p-[17px] lg:pt-2 transition-all lg:duration-300 duration-200 ',
                        // layout: slide-in on mobile, static on desktop
                        'fixed top-24 left-0 z-40 h-screen w-full lg:static bg-black-100/10 backdrop-blur-md',
                        // visibility: mobile uses `open`, desktop always visible
                        open ? 'backdrop-blur-xs' : 'backdrop-blur-[0px] z-[-1]',
                        'lg:translate-x-0',
                        // width behavior only on lg
                        collapsed ? 'lg:w-20' : 'lg:w-64',
                        // display rules so it’s hidden on mobile when closed, always block on lg
                        open ? 'block' : 'hidden',
                    )}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    // onClick={() => setOpen(prev => !prev)}
                    {...(open ? { onClick: () => setOpen(false) } : {})}
                >
                    <div
                        className={cn(
                            // 1. Replaced 'relative' with 'fixed'
                            // 2. Kept 'flex' and 'flex-col'
                            'fixed top-0 left-0 h-full w-[90%] lg:w-fit bg-primary rounded-r-lg lg:rounded-lg transition-all duration-300 lg:translate-x-0 p-2',
                            // collapsed ? 'lg:items-end' : 'lg:items-start',
                            open ? 'translate-x-[10%]' : 'translate-x-[200%]',
                        )}
                    >
                        <div
                            className={cn(
                                // 1. Replaced 'relative' with 'fixed'
                                // 2. Kept 'flex' and 'flex-col'
                                'flex flex-col gap-4 items-start p-2 relative',
                                // 3. Use [&>*]: to overwrite/apply classes to ALL direct children
                                // (Replace these specific classes with whatever you need the children to do)
                                '[&>*]:flex-col [&>*]:pb-2 [&>*]:w-full [&>*]:border-b-1 [&>*]:items-start [&_div]:gap-2 [&>*]:relative [&>*]:hover:text-action-hover [&>*]:bg-none ',
                                
                                '[&_a]:bg-transparent [&_a]:p-0 [&_a]:text-secondary-text [&_a]:no-underline hover:[&_a]:underline',

                                '[&_svg]:hidden'
                            )}>
                            {children}
                        </div>
                    </div>
                </aside>
                {/* </div> */}
            </header>
        </>
    );
};

export default DisplayBar;

// {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
//                 </svg>
//                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
//                 </svg> */}

//    backdrop-blur-[0px] z-0 lg:w-20 lg:block
//  z-40  backdrop-blur-xs  lg:w-64 lg:block