'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import PartyForm from '../components/PartyForm';
import { usePartyMutations } from '../hooks/usePartyMutations';

export default function NewPartyPage() {
  const router = useRouter();
  const { createParty, loading } = usePartyMutations();

  const handleSubmit = async (payload) => {
    const created = await createParty(payload, { toast: 'Party created' });

    // If backend returns created party, navigate to edit/view.
    const id = created?._id || created?.id;
    if (id) {
      router.push(`/parties/${id}/edit`);
      return;
    }

    router.push('/parties');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New Party</h1>
        <p className="text-secondary-text/70 text-sm">Create a customer, supplier, transporter, or any business party.</p>
      </div>

      <div className="card">
        <PartyForm
          mode="create"
          initialValues={{}}
          disabled={loading}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
