// src/components/layout/DashboardLayout.jsx
'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex flex-col max-h-screen h-screen overflow-hidden">
            <Topbar className="flex-[0_0]"/>  
            <div className="flex-1 min-h-full bg-gray-50 relative flex">
                <Sidebar/>
                <main className="pt-16 p-6">{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;