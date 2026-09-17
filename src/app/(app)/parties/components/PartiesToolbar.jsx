'use client';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';

import React, { useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import {
  PARTY_FILTER_STATUS_OPTIONS,
  PARTY_LIFECYCLE_OPTIONS,
  PARTY_PRIORITY_OPTIONS,
  PARTY_ROLE_OPTIONS,
} from '../lib/partyConstants';
import ExportPartiesButton from './ExportPartiesButton';
import ImportPartiesModal from './ImportPartiesModal';
import useAuthz from '@/hooks/useAuthz';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...PARTY_ROLE_OPTIONS,
];

const LIFECYCLE_OPTIONS = [
  { value: 'all', label: 'All lifecycle stages' },
  ...PARTY_LIFECYCLE_OPTIONS,
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  ...PARTY_PRIORITY_OPTIONS,
];

export default function PartiesToolbar({
  role,
  status,
  lifecycleStage,
  priority,
  q,
  onRoleChange,
  onStatusChange,
  onLifecycleChange,
  onPriorityChange,
  onQueryChange,
  onRefresh,
  loading = false,
}) {
  const [openImport, setOpenImport] = useState(false);
  const { can } = useAuthz();
  const canExport = can('parties:export');
  const canImport = can('parties:import');
  return (
    <>
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold">Business Partners</h1>
          <p className="text-secondary-text/70 text-sm">
            Customers, suppliers, service providers, prospects, and contacts.
          </p>
        </div>
        <div className="flex gap-2 items-start">
          <AdaptiveSelectInput
            placeholder="Select Role"
            value={role}
            onChange={(e) => onRoleChange?.(e.target.value)}
            options={ROLE_OPTIONS}
          />
          <AdaptiveSelectInput
            placeholder="Select Status"
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value)}
            options={PARTY_FILTER_STATUS_OPTIONS}
          />
          <AdaptiveSelectInput
            placeholder="Select Lifecycle Stage"
            value={lifecycleStage}
            onChange={(e) => onLifecycleChange?.(e.target.value)}
            options={LIFECYCLE_OPTIONS}
          />
          <AdaptiveSelectInput
            placeholder="Select Priority"
            value={priority}
            onChange={(e) => onPriorityChange?.(e.target.value)}
            options={PRIORITY_OPTIONS}
          />
          <CustomInput
            className="min-w-[260px] flex-1"
            value={q}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search code, name, contact, phone, email, GSTIN…"
          />
          <button
            type="button"
            className="btn-secondary h-fit"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {canExport && (
            <ExportPartiesButton
              role={role === 'all' ? '' : role}
              status={status}
              lifecycleStage={lifecycleStage === 'all' ? '' : lifecycleStage}
              priority={priority === 'all' ? '' : priority}
              q={q}
              className="btn-secondary h-fit text-nowrap"
            >
              Export
            </ExportPartiesButton>
          )}
          {canImport && (
            <button
              type="button"
              className="btn-secondary h-fit"
              onClick={() => setOpenImport(true)}
            >
              Import
            </button>
          )}
        </div>
      </div>
      {canImport && (
        <ImportPartiesModal
          open={openImport}
          onClose={() => setOpenImport(false)}
          onImported={() => onRefresh?.()}
        />
      )}
    </>
  );
}
