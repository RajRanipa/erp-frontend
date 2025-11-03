import React from 'react';
// src/app/components/EditButton.js

export default function EditButton({ onClick, itemName = '' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-100 text-action focus:outline-none cursor-pointer"
      aria-label={itemName ? `Edit ${itemName}` : 'Edit'}
    >
      {/* pencil svg */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 19.5l1.037-5.25L16.862 3.487z" />
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" />
      </svg>
    </button>
  );
}
