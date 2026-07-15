// src/app/components/layout/DisplayMain.jsx
import React, { Children } from 'react';

const DisplayMain = ({children}) => {
    return (
        <main className="px-4 py-3 z-8 w-full flex-1 min-h-0 overflow-y-auto bg-most text-most-text relative" id='main_display'>
            {children}
        </main>
    );
};

export default DisplayMain;