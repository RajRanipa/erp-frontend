'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useParty } from '../hooks/useParty';
import { usePartyMutations } from '../hooks/usePartyMutations';
import PartyStatusBadge from '../components/PartyStatusBadge';

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-secondary-text/70">{label}</div>
      <div className="text-sm break-words">{value || '—'}</div>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function PartyViewPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params?.id;

  const { data: party, loading, error, refetch } = useParty(partyId);
  const { setPartyStatus, deleteParty, loading: mutating } = usePartyMutations();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const addresses = useMemo(() => (Array.isArray(party?.addresses) ? party.addresses : []), [party]);
  const contacts = useMemo(() => (Array.isArray(party?.contacts) ? party.contacts : []), [party]);

  const defaultBilling = useMemo(
    () => addresses.find(a => a?.isDefaultBilling) || null,
    [addresses]
  );
  const defaultShipping = useMemo(
    () => addresses.find(a => a?.isDefaultShipping) || null,
    [addresses]
  );
  const primaryContact = useMemo(
    () => contacts.find(c => c?.isPrimary) || null,
    [contacts]
  );

  const toggleStatus = async () => {
    const current = String(party?.status || 'active');
    const next = current === 'active' ? 'inactive' : 'active';
    await setPartyStatus(partyId, next, { toast: 'Status updated' });
    refetch?.();
  };

  const doDelete = async () => {
    await deleteParty(partyId, { toast: 'Party deleted' });
    router.push('/parties');
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

  if (!party) {
    return (
      <div className="p-4">
        <div className="text-sm text-secondary-text">No party found.</div>
        <button className="btn-secondary mt-2" type="button" onClick={() => router.back()}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold truncate">{party.name || 'Party'}</h1>
            <PartyStatusBadge status={party.status} />
          </div>
          <p className="text-secondary-text/70 text-sm">
            {party.legalName ? party.legalName : 'Party master details'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Back
          </button>
          <button type="button" className="btn-primary" onClick={() => router.push(`/parties/${partyId}/edit`)}>
            Edit
          </button>
        </div>
      </div>

      {/* Overview */}
      <Section
        title="Overview"
        right={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={toggleStatus} disabled={mutating}>
              {String(party.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmingDelete(true)}
              disabled={mutating}
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Roles" value={Array.isArray(party.roles) && party.roles.length ? party.roles.join(', ') : ''} />
          <Field label="Phone" value={party.phone} />
          <Field label="Email" value={party.email} />
          <Field label="Website" value={party.website} />
          <Field label="Tax Registered" value={party?.taxProfile?.isTaxRegistered ? 'Yes' : 'No'} />
          <Field label="Tax ID" value={party?.taxProfile?.taxId} />
          <Field label="PAN" value={party?.taxProfile?.pan} />
          <Field label="Place of Supply" value={party?.taxProfile?.placeOfSupply} />
        </div>
      </Section>

      {/* Addresses */}
      <Section title="Addresses">
        {addresses.length === 0 ? (
          <div className="text-sm text-secondary-text/70">No addresses</div>
        ) : (
          <div className="space-y-3">
            {addresses.map((a, idx) => (
              <div key={idx} className="rounded-md border border-white-200 p-3 bg-white-100/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">
                    {a.label || 'Address'}
                    {(a.isDefaultBilling || a.isDefaultShipping) && (
                      <span className="text-xs text-secondary-text/70">
                        {' '}
                        ({a.isDefaultBilling ? 'Default Billing' : ''}{a.isDefaultBilling && a.isDefaultShipping ? ', ' : ''}{a.isDefaultShipping ? 'Default Shipping' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm mt-2 space-y-0.5">
                  <div>{a.line1 || '—'}</div>
                  {a.line2 ? <div>{a.line2}</div> : null}
                  <div>
                    {[a.city, a.state, a.pincode].filter(Boolean).join(', ') || '—'}
                  </div>
                  <div>{a.country || '—'}</div>
                </div>
              </div>
            ))}

            {(defaultBilling || defaultShipping) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border border-white-200 p-3">
                  <div className="text-xs text-secondary-text/70">Default Billing</div>
                  <div className="text-sm mt-1">{defaultBilling ? (defaultBilling.label || '—') : '—'}</div>
                </div>
                <div className="rounded-md border border-white-200 p-3">
                  <div className="text-xs text-secondary-text/70">Default Shipping</div>
                  <div className="text-sm mt-1">{defaultShipping ? (defaultShipping.label || '—') : '—'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Contacts */}
      <Section title="Contacts">
        {contacts.length === 0 ? (
          <div className="text-sm text-secondary-text/70">No contacts</div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, idx) => (
              <div key={idx} className="rounded-md border border-white-200 p-3 bg-white-100/40">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {c.name || '—'}
                    {c.isPrimary && <span className="text-xs text-secondary-text/70"> (Primary)</span>}
                  </div>
                  <div className="text-xs text-secondary-text/70">{c.designation || ''}</div>
                </div>
                <div className="text-sm mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Field label="Phone" value={c.phone} />
                  <Field label="Email" value={c.email} />
                </div>
              </div>
            ))}

            {primaryContact && (
              <div className="rounded-md border border-white-200 p-3">
                <div className="text-xs text-secondary-text/70">Primary Contact</div>
                <div className="text-sm mt-1">{primaryContact.name || '—'}</div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Payment terms */}
      <Section title="Payment & Credit">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Term Type" value={party?.paymentTerms?.type} />
          <Field label="Net Days" value={party?.paymentTerms?.netDays != null ? String(party.paymentTerms.netDays) : ''} />
          <Field label="Currency" value={party?.currency} />
          <Field label="Credit Limit" value={party?.creditLimit != null ? String(party.creditLimit) : ''} />
          <Field label="Note" value={party?.paymentTerms?.note} />
        </div>
      </Section>

      {/* Delete confirm */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-[1000]">
          <div
            className="absolute inset-0 bg-black/60"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setConfirmingDelete(false);
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border border-white-200 bg-secondary shadow-xl">
              <div className="p-4 border-b border-white-200">
                <h3 className="font-semibold">Delete Party?</h3>
                <p className="text-sm text-secondary-text/70 mt-1">
                  This action cannot be undone.
                </p>
              </div>
              <div className="p-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={mutating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={doDelete}
                  disabled={mutating}
                >
                  {mutating ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
