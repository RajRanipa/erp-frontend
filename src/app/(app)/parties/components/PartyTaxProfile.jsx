'use client';

import React, { useMemo } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

import {
  GST_REGISTRATION_TYPE_OPTIONS,
  INDIA_STATES,
  TAX_ID_TYPE_OPTIONS,
  TAX_ID_TYPES,
  TAX_REGISTERED_OPTIONS,
} from '../lib/partyConstants';

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

    const registered = Boolean(tp.isTaxRegistered);
    const gstin = asStr(tp.taxId).trim().toUpperCase();
    const pan = asStr(tp.pan).trim().toUpperCase();

    if (registered && !gstin) {
      out.taxId = 'GSTIN is required when Tax Registered is Yes';
    }

    if (gstin && (tp.taxIdType || TAX_ID_TYPES.GSTIN) === TAX_ID_TYPES.GSTIN) {
      if (!GSTIN_RE.test(gstin)) {
        out.taxId = 'GSTIN looks invalid (check format)';
      }
    }

    if (pan) {
      if (!PAN_RE.test(pan)) {
        out.pan = 'PAN looks invalid (check format)';
      }
    }

    return out;
  }, [india, tp.isTaxRegistered, tp.taxId, tp.pan]);

  const patch = (p) => {
    if (!onChange) return;
    onChange(p || {});
  };

  const reqTaxId = Boolean(tp.isTaxRegistered);
  const taxIdType = tp.taxIdType || (india ? TAX_ID_TYPES.GSTIN : TAX_ID_TYPES.OTHER);

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
            const registered = String(v) === 'true';
            patch({
              isTaxRegistered: registered,
              gstRegistrationType: registered ? 'REGULAR' : 'UNREGISTERED',
            });
          }}
          autoFocus
        />

        <SelectInput
          label="Tax ID Type"
          value={taxIdType}
          options={TAX_ID_TYPE_OPTIONS}
          disabled={disabled}
          onChange={(e) => patch({ taxIdType: e.target.value })}
        />

        <CustomInput
          label={taxIdType === TAX_ID_TYPES.GSTIN ? 'GSTIN' : 'Tax ID'}
          value={asStr(tp.taxId)}
          disabled={disabled}
          required={reqTaxId}
          error={errs.taxId}
          onChange={(e) => {
            const v = e?.target?.value ?? e;
            patch({ taxId: asStr(v).toUpperCase() });
          }}
          placeholder={taxIdType === TAX_ID_TYPES.GSTIN ? '24AAAAA0000A1Z5' : 'Tax ID'}
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

        {india && (
          <SelectInput
            label="GST Registration Type"
            value={tp.gstRegistrationType || (tp.isTaxRegistered ? 'REGULAR' : 'UNREGISTERED')}
            options={GST_REGISTRATION_TYPE_OPTIONS}
            disabled={disabled}
            onChange={(e) => patch({ gstRegistrationType: e.target.value })}
          />
        )}

        <CustomInput
          label="Registration Number"
          value={asStr(tp.registrationNumber)}
          disabled={disabled}
          onChange={(e) => patch({ registrationNumber: e.target.value })}
          placeholder="Business registration number"
        />

        {india && (
          <>
            <CustomInput
              label="CIN"
              value={asStr(tp.cin)}
              disabled={disabled}
              onChange={(e) => patch({ cin: asStr(e.target.value).toUpperCase() })}
              placeholder="Corporate Identification Number"
            />
            <CustomInput
              label="MSME / Udyam Number"
              value={asStr(tp.msmeNumber)}
              disabled={disabled}
              onChange={(e) => patch({ msmeNumber: asStr(e.target.value).toUpperCase() })}
              placeholder="UDYAM-XX-00-0000000"
            />
          </>
        )}
      </div>
    </div>
  );
}
