//src/app/crm/parties/edit/page.js

'use client';
// src/app/crm/parties/edit/page.js

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveParty } from '../../ActivePartyProviser';
import PartyForm from '../components/PartyForm';
import DisplayMain from '@/components/layout/DisplayMain';

export default function PartyEditPage() {
  const router = useRouter();
  const { activeParty } = useActiveParty();

  // If no active party is selected, redirect back to list
  useEffect(() => {
    if (!activeParty?._id) {
      router.replace('/crm/parties');
    }
  }, [activeParty, router]);

  if (!activeParty?._id) {
    return null; // Avoid flashing before redirect
  }

  return (
    <DisplayMain>
      <h1 className="text-2xl font-semibold text-secondary-text mb-4">
        Edit Party
      </h1>
      <PartyForm initial={activeParty} mode="edit" />
    </DisplayMain>
  );
}