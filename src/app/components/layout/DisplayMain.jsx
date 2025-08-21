// src/app/components/layout/DisplayMain.jsx
import React, { Children } from 'react';

const DisplayMain = ({children}) => {
    return (
        <main className="p-2 z-10 w-full h-full overflow-auto">
            {children}
        </main>
    );
};

export default DisplayMain;