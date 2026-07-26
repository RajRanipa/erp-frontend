import { deleteIcon } from '@/utils/SVG';
import React, { useEffect, useState } from 'react';
import useAuthz from '@/hooks/useAuthz';
import { cn } from '@/utils/cn';

export default function DeleteButton({ onClick, itemName = '', requiredPermissions = '', className = '' }) {
  const { can } = useAuthz();
  const [canDelete, setCanDelete] = useState(false);
  useEffect(() => {
    if (requiredPermissions) {
      const canDelete = can(requiredPermissions);
      return setCanDelete(canDelete)
    }
    setCanDelete(true)
  }, [requiredPermissions, can])
  return (
    <>
      {canDelete && <button
        onClick={onClick}
        className={cn("inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 focus:bg-red-50 text-error cursor-pointer text-xl border border-transparent focus:outline-none focus:ring-3 focus:ring-error/30  focus:border-0.5 focus:border-error ", className)}
        aria-label={itemName ? `Delete ${itemName}` : 'Delete'}
      >
        {/* trash svg */}
        {deleteIcon()}
      </button>}
    </>
  );
}
