import React from 'react';

export default function DeleteButton({ onClick, itemName = '' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-100 text-error focus:outline-none cursor-pointer"
      aria-label={itemName ? `Delete ${itemName}` : 'Delete'}
    >
      {/* trash svg */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7v10m6-10v10M4 7h16l-1 13a2 2 0 01-2 2H7a2 2 0 01-2-2L4 7z" />
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z" />
      </svg>
    </button>
  );
}
