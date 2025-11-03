'use client';
// src/app/crm/parties/view/page.js
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveParty } from '../../ActivePartyProviser';
import { useNavList } from '../../NavListContext';
import DisplayMain from '@/components/layout/DisplayMain';

function Section({ title, children }) {
  return (
    <section className="mb-6 rounded-lg border border-color-100 bg-most">
      <div className="px-4 py-3 border-b border-color-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-secondary-text">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-sm">
      <div className="text-secondary-text/70">{label}</div>
      <div className="col-span-2 break-words">{value || <span className="text-muted">—</span>}</div>
    </div>
  );
}

function AddressCard({ a, idx }) {
  return (
    <div className="rounded-lg  p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{a.label || `Address #${idx + 1}`}</div>
        <div className="text-xs text-secondary-text/70 space-x-2">
          {a.isDefaultBilling ? (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-600/10 text-emerald-600">Billing</span>
          ) : null}
          {a.isDefaultShipping ? (
            <span className="px-2 py-0.5 rounded-lg bg-indigo-600/10 text-indigo-600">Shipping</span>
          ) : null}
        </div>
      </div>
      <div className="text-sm leading-6">
        <div>{a.line1}</div>
        {a.line2 ? <div>{a.line2}</div> : null}
        <div>{[a.city, a.state, a.pincode].filter(Boolean).join(', ')}</div>
        <div className="text-xs text-secondary-text/70 mt-1">
          {a.stateCode ? `State code: ${a.stateCode}` : null}
          {a.country ? `${a.stateCode ? ' · ' : ''}Country: ${a.country}` : null}
        </div>
      </div>
    </div>
  );
}

export default function PartyViewPage() {
  const router = useRouter();
  const { activeParty } = useActiveParty();
  const { addLink, removeLink } = useNavList();

  // If no active party is set (e.g., direct URL visit), send the user back to the list.
  useEffect(() => {
    if (!activeParty?._id) {
      console.log('No active party, redirecting to list', activeParty);
      // router.replace('/crm/parties');
    }
  }, [activeParty, router]);

  useEffect(() => {
    if (!activeParty?._id) return;
    const href = '/crm/parties/edit';
    addLink({ href, name: 'Edit Party' });
    return () => removeLink(href);
  }, [activeParty?._id, addLink, removeLink]);

  if (!activeParty?._id) {
    return null; // Avoid flashing before redirect
  }


  const party = activeParty;
  const title = party.displayName || party.legalName || 'Party';

  return (
    <DisplayMain>
      {/* Header */}
      <section className="bg-most rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-secondary-text">{title}</h1>
            <div className="mt-1 text-sm text-secondary-text/70">
              {party.legalName && (
                <span>
                  Legal name: <span className="text-secondary-text">{party.legalName}</span>
                </span>
              )}
              {party.role ? (
                <span>
                  {' '}
                  · Role: <span className="capitalize">{party.role}</span>
                </span>
              ) : null}
              {party.status ? (
                <span>
                  {' '}
                  · Status: <span className="capitalize">{party.status}</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
          
          </div>
        </div>
      </section>

      {/* Tax */}
      <Section title="Tax">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="GSTIN" value={party.tax?.gstin} />
          <Field label="PAN" value={party.tax?.pan} />
        </div>
      </Section>

      {/* Addresses */}
      <Section title="Addresses">
        {Array.isArray(party.addresses) && party.addresses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {party.addresses.map((a, i) => (
              <AddressCard key={i} a={a} idx={i} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted">No addresses.</div>
        )}
      </Section>

      {/* Contacts */}
      <Section title="Contacts">
        {Array.isArray(party.contacts) && party.contacts.length > 0 && party?.contacts[0]?.name ? (
          <div className="grid md:grid-cols-2 gap-4">
            {party.contacts.map((c, i) => (
              <div key={i} className="rounded-lg  p-3 space-y-1 text-sm">
                <div className="font-medium">{c.name || `Contact #${i + 1}`}</div>
                <div>Email: {c.email || '—'}</div>
                <div>Phone: {c.phone || '—'}</div>
                {c.isPrimary ? <div className="text-xs text-emerald-600">Primary</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted">No contacts.</div>
        )}
      </Section>

      {/* Bank */}
      <Section title="Bank">
        {party.bank ? (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Account holder" value={party.bank.holderName} />
            <Field label="Bank" value={party.bank.bankName} />
            <Field label="Account number" value={party.bank.accountNo} />
            <Field label="IFSC" value={party.bank.ifsc} />
            <Field label="Branch" value={party.bank.branch} />
            <Field label="Type" value={party.bank.accountType} />
            {party.bank.notes ? (
              <div className="md:col-span-2">
                <div className="text-secondary-text/70 text-sm mb-1">Notes</div>
                <div className="rounded-lg  p-3 text-sm whitespace-pre-wrap">
                  {party.bank.notes}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted">No bank details.</div>
        )}
      </Section>
    </DisplayMain>
  );
}
