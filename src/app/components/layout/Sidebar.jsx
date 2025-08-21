// src/components/layout/Sidebar.jsx
'use client';

import Link from 'next/link';
import CustomInput from '../CustomInput';
import { useEffect, useRef } from 'react';

const Sidebar = () => {
    const searchRef = useRef(null);
    useEffect(() => {
        const inputEl = searchRef.current;
        if (!inputEl) return;

        const handleInput = (e) => {
            console.log(e.target.value);
            document.querySelectorAll('#sidebar_nav a').forEach((link) => {
                if (link.textContent.toLowerCase().includes(e.target.value.toLowerCase())) {
                    link.classList.remove('hidden');
                } else {
                    link.classList.add('hidden');
                }
            });
        };

        inputEl.addEventListener('input', handleInput);

        return () => {
            inputEl.removeEventListener('input', handleInput);
        };
    }, []);
    const sidebarList = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Inventory', href: '/inventory' },
        { name: 'Manufacturing', href: '/manufacturing' },
        { name: 'HR', href: '/hr' },
        { name: 'Billing', href: '/billing' },
        { name: 'Settings', href: '/settings' },
    ]
    return (
        <aside className="w-64 bg-gray-200 text-gray-700 max-h-full overflow-hidden flex flex-col">
            <div className="p-4 text-xl font-bold">
                <CustomInput type="text" placeholder="Search" parent_className='mb-0' className='bg-gray-50' id="sidebae_searchInput" ref={searchRef} />
            </div>
            <nav className=" space-y-2 px-4 overflow-auto h-full" id='sidebar_nav'>
                {sidebarList.map((item, index) => (
                    <Link key={index} href={item.href} className="block hover:text-blue-800 ">
                    {item.name.split('').map((letter, index) => (
                        <span key={index}>{letter}</span>
                    ))}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;