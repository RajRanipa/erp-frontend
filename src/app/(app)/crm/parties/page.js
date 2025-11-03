// src/app/crm/parties/page.js
'use client';
import { useDeferredValue, useMemo, useState, useEffect, useRef, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useParties } from './hooks/useParties';
import Link from 'next/link';
import DisplayMain from '@/Components/layout/DisplayMain';
import SelectInput from '@/Components/inputs/SelectInput';
import CustomInput from '@/Components/inputs/CustomInput';
import NavLink from '@/Components/NavLink';
import { useActiveParty } from '../ActivePartyProviser';

const Row = memo(({ p, onOpenParty }) => {
  // console.debug('Row render party', p._id, p.displayName || p.legalName);
  return (
    <tr className="hover:bg-most">
      <td className="px-3 py-2">
        <button
          className='text-blue-400 cursor-pointer'
          onClick={() => onOpenParty?.(p, "/crm/parties/view")}
        >
          {p.displayName || p.legalName}
        </button>
      </td>
      <td className="px-3 py-2 capitalize">{p.role}</td>
      <td className="px-3 py-2">{p.tax?.gstin || '-'}</td>
      <td className="px-3 py-2">{p.email || '-'}</td>
      <td className="px-3 py-2">{p.phone || '-'}</td>
      <td className="px-3 py-2 capitalize">{p.status}</td>
      <td className="px-3 py-2 text-right">
        <button
          className="text-secondary-text/80 underline cursor-pointer"
          onClick={() => onOpenParty?.(p, "/crm/parties/edit")}
        >
          Edit
        </button>
      </td>
    </tr>
  );
});

const roleoptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'all', label: 'all' }];

const statusoptions = [
  { value: 'any', label: 'any' },
  { value: 'active', label: 'active' },
  { value: 'draft', label: 'draft' },
  { value: 'archived', label: 'archived' },
]
export default function PartiesListPage() {
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('active');
  const { setActiveParty } = useActiveParty();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1), limit = 20;
  const dq = useDeferredValue(q);

  const { rows, total, loading, refetch } = useParties({ role, status, q: dq, page, limit });

  const router = useRouter();
  const onOpenParty = (party, href) => {
    // Set selection synchronously (provider persists to sessionStorage immediately)
    setActiveParty(party);
    // Navigate to the view page (no id in URL by design)
    router.push(href);
  };

  return (
    <DisplayMain>
      <div>
        <div className="flex items-center justify-between mb-1 gap-2">
          <h1 className="text-h2 font-semibold">Parties</h1>
          <div className="flex gap-2 w-auto">
            <SelectInput
              name={"party_role"}
              value={role}
              onChange={e => setRole(e.target.value)}
              options={roleoptions}
              className={"w-fit"}
            />
            <SelectInput
              name={"party_status"}
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={statusoptions}
              className={"w-fit"}
            />
            <CustomInput
              name={"search_party"}
              placeholder="Search name / GSTIN / email / phone"
              onChange={e => setQ(e.target.value)}
              value={q}
              className={"w-fit"}
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-color-100 rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary text-primary-text">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">GSTIN</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="px-3 py-6">Loading…</td></tr> :
                rows.length === 0 ? <tr><td className="px-3 py-6 text-secondaryText">No parties found.</td></tr> :
                  rows.map(p => <Row key={p._id} p={p} onOpenParty={onOpenParty} />)}
            </tbody>
          </table>
        </div>

        {/* Simple pager */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-secondaryText">Total: {total}</div>
          <div className="flex gap-2">
            <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn" disabled={(page * limit) >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </DisplayMain>
  );
}