// app/(app)/layout.js
'use client';
import React, { useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import { startAccessTokenTimer } from "@/lib/axiosInstance";

export default function AppLayout({ children }) {
    useEffect(() => {
        startAccessTokenTimer();
    }, []);
    // const childrenWithProps = React.Children.map(children, (child) => {
    //     if (React.isValidElement(child)) {
    //         return React.cloneElement(child, { setTitle, setHref });
    //     }
    //     return child;
    // });

    return (
        <div className="flex flex-col max-h-screen h-screen overflow-hidden">
            <Topbar className="flex-[0_0]" />
            <div className="flex-1 bg-transparent relative flex overflow-hidden">
                <Sidebar />
                <div className='w-full overflow-hidden flex flex-col p-2 bg-primary'>
                    <main className="w-full flex-1 bg-secondary text-secondary-text border border-color-100 rounded-lg overflow-hidden flex flex-col">
                        {/* <header className={`border-b border-color-100 shadow-sm z-9 flex items-center gap-4 p-2 top-0 w-full bg-secondary text-secondary-text`}>
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
                        </header> */}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}