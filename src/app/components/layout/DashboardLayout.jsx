// src/components/layout/DashboardLayout.jsx
'use client';
import DisplayBar from './DisplayBar';
import DisplayMain from './DisplayMain';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = ({ children, Bar = false }) => {
    return (
        <div className="flex flex-col max-h-screen h-screen overflow-hidden">
            <Topbar className="flex-[0_0]"/>  
            <div className="flex-1 bg-gray-50 relative flex overflow-hidden">
                <Sidebar/>
                 <main className="w-full overflow-hidden flex flex-col">
                    { Bar && <DisplayBar/>}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;