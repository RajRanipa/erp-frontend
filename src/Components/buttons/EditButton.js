import { cn } from '@/utils/cn';
import { editIcon } from '@/utils/SVG';
import React from 'react';
// src/app/components/EditButton.js

export default function EditButton({ onClick, itemName = '', className = '' }) {
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-100 text-action focus:outline-none cursor-pointer text-xl", className)}
      aria-label={itemName ? `Edit ${itemName}` : 'Edit'}
    >
      {editIcon()}
    </button>
  );
}
