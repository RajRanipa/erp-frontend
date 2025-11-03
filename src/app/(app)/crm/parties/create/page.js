// src/app/crm/parties/create/page.js
'use client';

import DisplayMain from '@/components/layout/DisplayMain';
import PartyForm from '../components/PartyForm';

export default function CreatePartyPage() {
  return (
    <DisplayMain>
      <h1 className="text-h2 font-semibold mb-4">Create Party</h1>
      <PartyForm mode="create" />
    </DisplayMain>
  );
}
