'use client';
import React from 'react';
import NavLink from '@/Components/NavLink';
import { cn } from '@/utils/cn';
import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <div className={cn(
      'w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6 text-secondary-text'
    )}>
      <h1 className="text-5xl font-bold text-danger">403</h1>
      <h2 className="text-2xl font-semibold">Access Denied</h2>
      <p className="text-sm max-w-md text-muted">
        You don’t have permission to view this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <button
        type="button"
        onClick={() => router.back()}
        className="px-4 py-2 bg-action text-white rounded-md hover:opacity-90"
      >
        Go Back
      </button>
    </div>
  );
}