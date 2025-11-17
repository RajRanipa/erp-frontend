// src/Components/RequirePerm.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthz from '@/hooks/useAuthz';

export default function RequirePerm({ perm, children }) {
  const { can, ready } = useAuthz(); // ensure `ready` tells when user/permissions loaded
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (can(perm)) setAllowed(true);
    else router.replace('/403');
  }, [ready, can, perm, router]);

  if (!ready) return null;      // or a skeleton
  if (!allowed) return null;    // will redirect
  return children;
}