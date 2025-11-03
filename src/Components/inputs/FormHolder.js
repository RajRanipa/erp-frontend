
'use client';
import { cn } from '../../utils/cn';

export default function FormHolder({ title, className = '', submitbtn, children }) {
    const finalClass = cn(`${className} rounded-lg p-3 bg-most-secondary text-most-text mb-4 shadow-sm`);
    return (
        <div className={finalClass}>
            {(title || submitbtn) && (<div className='flex w-full items-center justify-between mb-4'>
                <h2>{title}</h2>
                <div className='flex gap-3'>
                    {submitbtn}
                </div>
            </div>)}
            <div>
                {children}
            </div>
        </div>
    );
}