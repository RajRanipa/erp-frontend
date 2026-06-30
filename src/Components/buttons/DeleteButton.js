import { deleteIcon } from '@/utils/SVG';
import React, { useEffect, useState } from 'react';
import useAuthz from '@/hooks/useAuthz';
import { cn } from '@/utils/cn';

export default function DeleteButton({ onClick, itemName = '', requiredPermissions = '' , className = ''}) {
  const { can } = useAuthz();
  const [canDelete, setCanDelete] = useState(false);
  useEffect(() => {
    if(requiredPermissions){
      const canDelete = can(requiredPermissions);
      return setCanDelete(canDelete)
    }
    setCanDelete(true)
  },[requiredPermissions, can])
  return (
    <>
    { canDelete && <button
      onClick={onClick}
      className={cn("inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-100 text-error focus:outline-none cursor-pointer text-xl", className)}
      aria-label={itemName ? `Delete ${itemName}` : 'Delete'}
    >
      {/* trash svg */}
      {deleteIcon()}
    </button>}
    </>
  );
}
