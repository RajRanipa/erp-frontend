// app/(app)/layout.js
'use client';
import React, { useEffect, useState } from "react";
import Topbar from "@/Components/layout/Topbar";
import Sidebar from "@/Components/layout/Sidebar";
import { startAccessTokenTimer } from "@/lib/axiosInstance";

export default function AppLayout({ children }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        startAccessTokenTimer();
    }, []);

    useEffect(() => {
        // console.log('open', open);
    }, [open]);
    // const childrenWithProps = React.Children.map(children, (child) => {
    //     if (React.isValidElement(child)) {
    //         return React.cloneElement(child, { setTitle, setHref });
    //     }
    //     return child;
    // });

    return (
        // <ServerUserProvider>
            <div className="flex flex-col max-h-screen h-screen overflow-hidden">
                <Topbar className="flex-[0_0]" open={open} setOpen={setOpen} />
                <div className="flex-1 bg-transparent relative flex overflow-hidden">
                    <Sidebar open={open} setOpen={setOpen} />
                    <div className='w-full overflow-hidden flex flex-col p-2 pt-0 bg-primary'>
                        <main className="w-full flex-1 bg-secondary text-secondary-text border border-color-100 rounded-lg overflow-hidden flex flex-col">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        // </ServerUserProvider>
    );
}