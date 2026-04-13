'use client';

import React, { useMemo } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

import { INDIA_STATES, TAX_REGISTERED_OPTIONS } from '../lib/partyConstants';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function asStr(v) {
  return v == null ? '' : String(v);
}

function isIndia(country) {
  const c = asStr(country).trim().toLowerCase();
  return c === 'india' || c === 'in' || c === 'bharat';
}

export default function PartyTaxProfile({
  taxProfile,
  country = 'India',
  disabled = false,
  onChange,
  title = 'Tax Profile',
}) {
  const tp = taxProfile && typeof taxProfile === 'object' ? taxProfile : {};
  const india = isIndia(country);

  const errs = useMemo(() => {
    const out = {};

    if (!india) return out;

    const registered = !!tp.isTaxRegistered;
    const gstin = asStr(tp.taxId).trim().toUpperCase();
    const pan = asStr(tp.pan).trim().toUpperCase();

    if (registered && !gstin) {
      out.taxId = 'GSTIN is required when Tax Registered is Yes';
    }

    if (gstin) {
      if (gstin.length >= 10 && !GSTIN_RE.test(gstin)) {
        out.taxId = 'GSTIN looks invalid (check format)';
      }
    }

    if (pan) {
      if (pan.length >= 5 && !PAN_RE.test(pan)) {
        out.pan = 'PAN looks invalid (check format)';
      }
    }

    return out;
  }, [india, tp.isTaxRegistered, tp.taxId, tp.pan]);

  const patch = (p) => {
    if (!onChange) return;
    onChange(p || {});
  };

  const reqTaxId = india && !!tp.isTaxRegistered;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-secondary-text/70">
          {india
            ? 'India: GSTIN required only when Tax Registered is Yes.'
            : 'Non-India: Tax ID is treated as generic.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectInput
          label="Tax Registered"
          value={String(!!tp.isTaxRegistered)}
          options={TAX_REGISTERED_OPTIONS}
          disabled={disabled}
          onChange={(e) => {
            const v = e?.target?.value ?? e;
            patch({ isTaxRegistered: String(v) === 'true' });
          }}
          autoFocus
        />

        <CustomInput
          label={india ? 'GSTIN' : 'Tax ID'}
          value={asStr(tp.taxId)}
          disabled={disabled}
          required={reqTaxId}
          error={errs.taxId}
          onChange={(e) => {
            const v = e?.target?.value ?? e;
            patch({ taxId: asStr(v).toUpperCase() });
          }}
          placeholder={india ? '24AAAAA0000A1Z5' : 'Tax ID'}
        />

        <CustomInput
          label="PAN"
          value={asStr(tp.pan)}
          disabled={disabled}
          error={errs.pan}
          onChange={(e) => {
            const v = e?.target?.value ?? e;
            patch({ pan: asStr(v).toUpperCase() });
          }}
          placeholder="AAAAA0000A"
        />

        {india ? (
          <SelectTypeInput
            label="Place of Supply"
            value={asStr(tp.placeOfSupply)}
            disabled={disabled}
            options={(INDIA_STATES || []).map((s) => ({ value: s, label: s }))}
            onChange={(e) => {
              const v = e?.target?.value ?? e;
              patch({ placeOfSupply: v });
            }}
          />
        ) : (
          <CustomInput
            label="Place of Supply"
            value={asStr(tp.placeOfSupply)}
            disabled={disabled}
            onChange={(e) => {
              const v = e?.target?.value ?? e;
              patch({ placeOfSupply: v });
            }}
            placeholder="State / Region"
          />
        )}
      </div>
    </div>
  );
}