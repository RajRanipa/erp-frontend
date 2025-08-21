// src/app/components/layout/DisplayBar.jsx
import React, { Children } from 'react';

const DisplayBar = ({title, children}) => {
    return (
        <header className="border-b border-gray-200 shadow-sm z-10 flex items-center gap-4 p-2 top-0 w-full">
            <div className='flex gap-4'><h1 className="text-lg text-gray-600 font-medium text-nowrap border-r-2 border-gray-500 pr-4">{title}</h1></div>
            <div className="flex items-center justify-between gap-4 w-full">
                {children}
            </div>
        </header>
    );
};

export default DisplayBar;