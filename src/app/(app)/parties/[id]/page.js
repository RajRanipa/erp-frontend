'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useParty } from '../hooks/useParty';
import { usePartyMutations } from '../hooks/usePartyMutations';
import PartyStatusBadge from '../components/PartyStatusBadge';
import { PARTY_STATUS } from '../lib/partyConstants';
import useAuthz from '@/hooks/useAuthz';

function Field({ label, value }) {
  const display = value === 0 ? '0' : value || '—';
  return (
    <div className="min-w-0">
      <div className="text-xs text-secondary-text/70">{label}</div>
      <div className="text-sm break-words">{display}</div>
    </div>
  );
}

function Section({ title, description, children, right }) {
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-xs text-secondary-text/70">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function formatAddress(address) {
  return [
    address?.line1,
    address?.line2,
    address?.area,
    address?.city,
    address?.district,
    address?.state,
    address?.pincode,
    address?.country,
  ].filter(Boolean).join(', ');
}

function maskAccount(value) {
  const account = String(value || '');
  if (account.length <= 4) return account || '—';
  return `${'•'.repeat(Math.min(account.length - 4, 8))}${account.slice(-4)}`;
}

export default function PartyViewPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params?.id;
  const { data: party, loading, error, refetch } = useParty(partyId);
  const {
    setPartyStatus,
    deleteParty,
    restoreParty,
    loading: mutating,
  } = usePartyMutations();
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const { can } = useAuthz();
  const canWrite = can('parties:write');

  const addresses = useMemo(() => {
    if (!party?.addresses) return [];
    if (Array.isArray(party.addresses)) return party.addresses;
    return [
      party.addresses.primaryAddress,
      ...(party.addresses.additionalAddresses || []),
    ].filter(Boolean);
  }, [party]);
  const contacts = Array.isArray(party?.contacts) ? party.contacts : [];
  const banks = Array.isArray(party?.bankAccounts) ? party.bankAccounts : [];

  const changeStatus = async status => {
    await setPartyStatus(partyId, status);
    await refetch();
  };

  const archive = async () => {
    await deleteParty(partyId);
    setConfirmingArchive(false);
    await refetch();
  };

  const restore = async () => {
    await restoreParty(partyId);
    await refetch();
  };

  if (loading) return <div className="p-4 text-sm text-secondary-text">Loading…</div>;
  if (error) {
    return (
      <div className="card p-4 space-y-3">
        <div className="text-red-400">
          {error?.response?.data?.message || error.message || 'Failed to load business partner'}
        </div>
        <button type="button" className="btn-secondary" onClick={refetch}>Retry</button>
      </div>
    );
  }
  if (!party) return <div className="p-4 text-sm text-secondary-text">Business partner not found.</div>;

  const archived = party.status === PARTY_STATUS.ARCHIVED;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{party.name}</h1>
            <PartyStatusBadge status={party.status} />
            <span className="text-xs px-2 py-1 rounded border border-white-200">
              {party.lifecycleStage || 'ACTIVE'}
            </span>
            <span className="text-xs px-2 py-1 rounded border border-white-200">
              {party.priority || 'NORMAL'}
            </span>
          </div>
          <p className="text-sm text-secondary-text/70">
            {party.code} {party.legalName ? `· ${party.legalName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => router.push('/parties')}>
            Back
          </button>
          {!archived && canWrite && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => router.push(`/parties/${partyId}/edit`)}
            >
              Edit
            </button>
          )}
          {canWrite && (archived ? (
            <button type="button" className="btn-primary" onClick={restore} disabled={mutating}>
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmingArchive(true)}
              disabled={mutating}
            >
              Archive
            </button>
          ))}
        </div>
      </div>

      <Section
        title="Business identity"
        right={!archived && canWrite && (
          <div className="flex gap-2">
            {party.status !== PARTY_STATUS.ACTIVE && (
              <button
                type="button"
                className="btn-secondary"
                disabled={mutating}
                onClick={() => changeStatus(PARTY_STATUS.ACTIVE)}
              >
                Activate
              </button>
            )}
            {party.status === PARTY_STATUS.ACTIVE && (
              <button
                type="button"
                className="btn-secondary"
                disabled={mutating}
                onClick={() => changeStatus(PARTY_STATUS.INACTIVE)}
              >
                Deactivate
              </button>
            )}
            {party.status !== PARTY_STATUS.BLOCKED && (
              <button
                type="button"
                className="btn-secondary"
                disabled={mutating}
                onClick={() => changeStatus(PARTY_STATUS.BLOCKED)}
              >
                Block
              </button>
            )}
          </div>
        )}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Partner code" value={party.code} />
          <Field label="Type" value={party.partyType} />
          <Field label="Roles" value={(party.roles || []).join(', ')} />
          <Field label="Industry" value={party.industry} />
          <Field label="Lifecycle" value={party.lifecycleStage} />
          <Field label="Priority" value={party.priority} />
          <Field label="Lead source" value={party.leadSource} />
          <Field label="Account owner" value={party.accountOwner?.fullName} />
        </div>
      </Section>

      <Section title="Communication">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Phone" value={party.phone} />
          <Field label="Alternate phone" value={party.alternatePhone} />
          <Field label="Email" value={party.email} />
          <Field label="Website" value={party.website} />
          <Field
            label="Preferred channel"
            value={party.communicationPreferences?.preferredChannel}
          />
          <Field
            label="Do not contact"
            value={party.communicationPreferences?.doNotContact ? 'Yes' : 'No'}
          />
          <Field
            label="WhatsApp opt-in"
            value={party.communicationPreferences?.whatsappOptIn ? 'Yes' : 'No'}
          />
          <Field label="Tags" value={(party.tags || []).join(', ')} />
        </div>
      </Section>

      <Section title="Tax and compliance">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Tax registered" value={party.taxProfile?.isTaxRegistered ? 'Yes' : 'No'} />
          <Field label="Tax ID type" value={party.taxProfile?.taxIdType} />
          <Field label="Tax ID" value={party.taxProfile?.taxId} />
          <Field label="PAN" value={party.taxProfile?.pan} />
          <Field label="GST registration" value={party.taxProfile?.gstRegistrationType} />
          <Field label="Registration number" value={party.taxProfile?.registrationNumber} />
          <Field label="CIN" value={party.taxProfile?.cin} />
          <Field label="MSME / Udyam" value={party.taxProfile?.msmeNumber} />
          <Field label="Place of supply" value={party.taxProfile?.placeOfSupply} />
        </div>
      </Section>

      <Section title="Addresses">
        {!addresses.length ? (
          <div className="text-sm text-secondary-text/70">No address information.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {addresses.map((address, index) => (
              <div key={address._id || index} className="rounded border border-white-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">
                    {index === 0 ? 'Primary · ' : ''}{address.label || 'Address'}
                  </span>
                  {(address.purposes || []).map(purpose => (
                    <span key={purpose} className="text-xs px-2 py-0.5 rounded bg-white-200">
                      {purpose}
                    </span>
                  ))}
                </div>
                <div className="text-sm mt-2">{formatAddress(address) || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Contacts">
        {!contacts.length ? (
          <div className="text-sm text-secondary-text/70">No contact persons.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {contacts.map((contact, index) => (
              <div key={contact._id || index} className="rounded border border-white-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">
                    {contact.name || 'Unnamed contact'}
                    {contact.isPrimary ? ' · Primary' : ''}
                  </div>
                  <span className="text-xs text-secondary-text/70">
                    {[contact.department, contact.designation].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Field label="Phone" value={contact.phone} />
                  <Field label="Email" value={contact.email} />
                  <Field label="Preferred channel" value={contact.preferredChannel} />
                  <Field label="Decision maker" value={contact.isDecisionMaker ? 'Yes' : 'No'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Commercial defaults">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Payment terms" value={party.paymentTerms?.type} />
          <Field label="Net days" value={party.paymentTerms?.netDays} />
          <Field label="Currency" value={party.currency} />
          <Field label="Credit limit" value={party.creditLimit?.toLocaleString?.() || party.creditLimit} />
          <Field label="Payment note" value={party.paymentTerms?.note} />
        </div>
      </Section>

      <Section title="Bank accounts" description="Account numbers are masked in the detail view.">
        {!banks.length ? (
          <div className="text-sm text-secondary-text/70">No bank accounts.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {banks.map((account, index) => (
              <div key={account._id || index} className="rounded border border-white-100 p-3">
                <div className="font-medium text-sm">
                  {account.bankName || 'Bank account'} {account.isPrimary ? '· Primary' : ''}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Field label="Account holder" value={account.accountHolderName} />
                  <Field label="Account number" value={maskAccount(account.accountNumber)} />
                  <Field label="IFSC" value={account.ifscCode} />
                  <Field label="Branch" value={account.branch} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Data quality and audit">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Field label="Completeness" value={`${party.dataQuality?.score || 0}%`} />
          <Field label="Missing information" value={(party.dataQuality?.missing || []).join(', ')} />
          <Field label="Created by" value={party.createdBy?.fullName} />
          <Field label="Updated by" value={party.updatedBy?.fullName} />
          <Field
            label="Updated at"
            value={party.updatedAt ? new Date(party.updatedAt).toLocaleString() : ''}
          />
          <Field label="Notes" value={party.notes} />
        </div>
      </Section>

      {confirmingArchive && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-white-200 bg-secondary shadow-xl p-4">
            <h3 className="font-semibold">Archive business partner?</h3>
            <p className="text-sm text-secondary-text/70 mt-1">
              Archived partners are hidden from active selections but remain available for audit and can be restored.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmingArchive(false)}
                disabled={mutating}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={archive} disabled={mutating}>
                {mutating ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
