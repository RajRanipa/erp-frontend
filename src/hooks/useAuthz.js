// src/app/hook/useAuthz.js
'use client';
import { useUser } from '@/context/UserContext';

// Helper to check wildcard implication
const impliesFull = (allowed, perm) => {
  // console.log("allowed", allowed.includes(perm) ,"perm", perm)
  if (allowed.includes(perm)) return true;
  const [resource] = perm.split(':');
  return allowed.includes(`${resource}:full`);
};

export default function useAuthz() {
  const { role, permissions} = useUser() || {};

  const isOwner = role === 'owner';

  // Check if user can perform a permission
//   console.log("useAuthz called", companyId, companyName, userId, role)
  const can = (permOrPerms) => {
    // if (isOwner) return true; // Owner full access
    const required = Array.isArray(permOrPerms) ? permOrPerms : [permOrPerms];
    // console.log("required", required)
    // console.log("permissions", permissions)
    if (required.length === 0) return true;
    return required.every((p) => impliesFull(permissions, p));
  };

  return {
    can,
    isOwner,
    role: role,
    permissions,
  };
}