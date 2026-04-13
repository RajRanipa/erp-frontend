'use client';

import React, { useCallback, useMemo } from 'react';
import { PARTY_ROLES, PARTY_ROLE_OPTIONS, normalizePartyRoles } from '../lib/partyConstants';
import CheckBox from '@/Components/inputs/CheckBox';

// Roles picker for Party.
// Backend expects: roles: ['SUPPLIER','CUSTOMER',...]
// Controlled component:
//  - value: array of roles
//  - onChange(nextRoles)

export default function PartyRolesPicker({ value = [], onChange, disabled = false, required = true }) {
  const set = useMemo(() => new Set(normalizePartyRoles(value)), [value]);

  const toggle = useCallback(
    (role) => {
      if (!onChange) return;
      const next = new Set(set);
      if (next.has(role)) {
        // If required, never allow removing the last role
        if (required && next.size === 1) return;
        next.delete(role);
      } else {
        next.add(role);
      }
      onChange(normalizePartyRoles(Array.from(next)));
    },
    [onChange, required, set]
  );

  const quickSet = useCallback(
    (roles) => {
      if (!onChange) return;
      onChange(normalizePartyRoles(roles));
    },
    [onChange]
  );

  const hasAny = set.size > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className='mb-2'>
          <h3 className="font-semibold">Roles</h3>
          <p className="text-xs text-secondary-text/70">Select what this party is (supplier/customer/etc.).</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => quickSet([PARTY_ROLES.SUPPLIER])}
            disabled={disabled}
          >
            Supplier only
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => quickSet([PARTY_ROLES.CUSTOMER])}
            disabled={disabled}
          >
            Customer only
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => quickSet([PARTY_ROLES.SUPPLIER, PARTY_ROLES.CUSTOMER])}
            disabled={disabled}
          >
            Both
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PARTY_ROLE_OPTIONS.map((r, idx) => {
          const checked = set.has(r.value);
          return (
            <CheckBox
              key={r.value}
              name={"partyRole"}
              checked={checked}
              value={r.value}
              onChange={() => toggle(r.value)}
              disabled={disabled}
              autoFocus={idx === 0}
            />
          );
        })}
      </div>

      {!hasAny && required && (
        <div className="text-xs text-red-400">At least one role is required.</div>
      )}
    </div>
  );
}