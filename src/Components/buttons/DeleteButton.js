import { deleteIcon } from '@/utils/SVG';
import React from 'react';

export default function DeleteButton({ onClick, itemName = '' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-100 text-error focus:outline-none cursor-pointer text-xl"
      aria-label={itemName ? `Delete ${itemName}` : 'Delete'}
    >
      {/* trash svg */}
      {deleteIcon()}
    </button>
  );
}
