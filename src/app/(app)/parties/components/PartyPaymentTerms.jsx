'use client';

import React, { useMemo } from 'react';
import SelectInput from '@/Components/inputs/SelectInput';
import CustomInput from '@/Components/inputs/CustomInput';
import { DEFAULT_CURRENCY, PAYMENT_TERM_TYPE_OPTIONS, PAYMENT_TERM_TYPES } from '../lib/partyConstants';

// Payment Terms section for Party.
// Parent owns state:
//  - paymentTerms: { type: 'DUE_ON_RECEIPT'|'NET_DAYS'|'CUSTOM', netDays, note }
//  - currency: string
//  - creditLimit: number
//
// This component is universal (any industry) and matches backend Party schema.

export default function PartyPaymentTerms({
  paymentTerms,
  currency,
  creditLimit,
  onChange,
  disabled = false,
}) {
  const pt = paymentTerms || {};

  const showNetDays = useMemo(() => (pt.type || PAYMENT_TERM_TYPES.NET_DAYS) === PAYMENT_TERM_TYPES.NET_DAYS, [pt.type]);

  const set = (patch) => {
    if (!onChange) return;
    onChange({
      paymentTerms: {
        type: pt.type || PAYMENT_TERM_TYPES.NET_DAYS,
        netDays: Number.isFinite(Number(pt.netDays)) ? Number(pt.netDays) : 30,
        note: pt.note || '',
        ...(patch.paymentTerms || {}),
      },
      currency: patch.currency !== undefined ? patch.currency : currency,
      creditLimit: patch.creditLimit !== undefined ? patch.creditLimit : creditLimit,
    });
  };

  return (
    <div className="space-y-3">
      <div className='mb-2'>
        <h3 className="font-semibold">Payment Terms</h3>
        <p className="text-xs text-secondary-text/70">
          Defaults used for Purchase Orders / Sales Orders and (later) accounting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectInput
          label="Term Type"
          value={pt.type || PAYMENT_TERM_TYPES.NET_DAYS}
          onChange={(e) => {
            const nextType = e.target.value;
            const next = { paymentTerms: { type: nextType } };
            // Keep netDays sane
            if (nextType === PAYMENT_TERM_TYPES.NET_DAYS) next.paymentTerms.netDays = Number(pt.netDays ?? 30);
            if (nextType === PAYMENT_TERM_TYPES.DUE_ON_RECEIPT) next.paymentTerms.netDays = 0;
            set(next);
          }}
          options={PAYMENT_TERM_TYPE_OPTIONS}
          disabled={disabled}
        />

        <CustomInput
          label="Net Days"
          type="number"
          value={showNetDays ? String(pt.netDays ?? 30) : '0'}
          onChange={(e) => set({ paymentTerms: { netDays: Number(e.target.value || 0) } })}
          disabled={disabled || !showNetDays}
          placeholder="30"
        />

        <CustomInput
          label="Currency"
          value={currency || DEFAULT_CURRENCY}
          onChange={(e) => set({ currency: e.target.value })}
          disabled={disabled}
          placeholder={DEFAULT_CURRENCY}
        />

        <CustomInput
          label="Credit Limit"
          type="number"
          value={creditLimit === undefined || creditLimit === null ? '' : String(creditLimit)}
          onChange={(e) => set({ creditLimit: Number(e.target.value || 0) })}
          disabled={disabled}
          placeholder="0"
        />

        <div className="md:col-span-2">
          <CustomInput
            label="Note"
            value={pt.note || ''}
            onChange={(e) => set({ paymentTerms: { note: e.target.value } })}
            disabled={disabled}
            placeholder="e.g., Payment by NEFT within 15 days"
          />
        </div>
      </div>
    </div>
  );
}