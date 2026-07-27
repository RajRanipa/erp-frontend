

'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import PartyForm from '../../components/PartyForm';
import { useParty } from '../../hooks/useParty';
import { usePartyMutations } from '../../hooks/usePartyMutations';
import { apiPartyToForm } from '../../lib/partyMappers';

export default function EditPartyPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params?.id;

  const { data: party, loading, error, refetch } = useParty(partyId);
  const { updateParty, loading: saving } = usePartyMutations();

  const initialValues = useMemo(() => (party ? apiPartyToForm(party) : null), [party]);

  const handleSubmit = async (payload) => {
    await updateParty(partyId, payload, { toast: 'Business partner updated' });
    // Re-fetch to keep UI in sync if you stay on the same page
    refetch?.();
  };

  if (!partyId) {
    return (
      <div className="p-4">
        <div className="text-red-400">Missing party id in route.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm text-secondary-text">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 p-4">
        <div className="text-red-400">Failed to load party.</div>
        <div className="text-xs text-secondary-text/70">{error?.response?.data?.message || error?.message}</div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" type="button" onClick={() => refetch?.()}>
            Retry
          </button>
          <button className="btn-secondary" type="button" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="p-4">
        <div className="text-sm text-secondary-text">No party found.</div>
        <button className="btn-secondary mt-2" type="button" onClick={() => router.back()}>
          Back
        </button>
      </div>
    );
  }

  if (party?.status === 'archived') {
    return (
      <div className="card p-4 space-y-3">
        <div className="font-semibold">Archived business partners cannot be edited.</div>
        <p className="text-sm text-secondary-text/70">Restore this record from its detail page first.</p>
        <button type="button" className="btn-secondary" onClick={() => router.push(`/parties/${partyId}`)}>
          View record
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Edit Business Partner</h1>
          <p className="text-secondary-text/70 text-sm">
            Maintain one reliable record for ERP operations and future CRM workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>

      <div className="card">
        <PartyForm
          mode="edit"
          initialValues={initialValues}
          disabled={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
