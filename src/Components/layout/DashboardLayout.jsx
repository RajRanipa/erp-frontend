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
            <div className="flex-1 bg-transparent relative flex overflow-hidden">
                <Sidebar/>
                <div className='w-full overflow-hidden flex flex-col p-2 bg-primary'>
                 <main className="w-full flex-1 bg-secondary text-secondary-text border border-color-100 rounded-lg overflow-hidden flex flex-col">
                    { Bar && <DisplayBar/>}
                    {children}
                </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;