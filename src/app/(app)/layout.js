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

    return (
        <div className="flex flex-col h-[100dvh] min-h-[100dvh] overflow-hidden mobile-safe-bottom">
            <Topbar
                className="shrink-0"
                open={open}
                setOpen={setOpen}
            />

            <div className="flex flex-1 min-h-0 bg-transparent relative overflow-hidden">
                <Sidebar open={open} setOpen={setOpen} />

                <div className="w-full flex flex-col min-w-0 min-h-0 overflow-hidden p-2 pt-0 bg-primary">
                    <main
                        className="
                            w-full
                            flex-1
                            min-h-0
                            bg-secondary
                            text-secondary-text
                            border
                            border-color-100
                            rounded-lg
                            overflow-hidden
                            flex
                            flex-col
                            z-5
                        "
                    >
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}