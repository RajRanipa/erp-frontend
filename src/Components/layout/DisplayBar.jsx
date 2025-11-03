// src/app/components/layout/DisplayBar.jsx
"use client";
import React, { Children } from 'react';
import NavLink from '../NavLink';
import { useRouter } from "next/navigation";
import { cn } from '../../utils/cn';

const DisplayBar = ({ title, children, href, className = '' }) => {
    const router = useRouter();
    return (
        <header className={cn(`border-b border-color-100 shadow-sm z-9 flex items-center gap-4 p-2 top-0 w-full bg-secondary text-secondary-text ${className}`)}>
            <div className='flex gap-4 border-r-2 border-gray-500 pr-4 items-center'>
                <button onClick={() => router.back()} className='cursor-pointer transition-transform duration-300 hover:-translate-x-1 text-primary-text hover:text-secondary-text'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <NavLink
                    href={href}
                    type="link"
                    className='text-nowrap capitalize text-lg font-medium'
                >
                    {title}
                </NavLink>
            </div>
            <div className="flex items-center justify-between gap-4 w-full">
                {children}
            </div>
        </header>
    );
};

export default DisplayBar;

// {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
//                 </svg>
//                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
//                 </svg> */}