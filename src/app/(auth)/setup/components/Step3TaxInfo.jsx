'use client';
import React, { useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';

/**
 * Step3TaxInfo — collects PAN / GST and optional tax region.
 *
 * Props (WizardShell contract):
 * - values: full company object (expects values.taxInfo)
 * - saving: boolean (disable inputs while saving)
 * - onValidityChange: (boolean) => void
 * - onDirtyChange: (boolean) => void
 * - onPartialChange: (partial) => void
 */
export default function Step3TaxInfo({ values = {}, saving, onValidityChange, onDirtyChange, onPartialChange }) {
  const initial = useMemo(() => ({
    panNumber: '',
    gstNumber: '',
    taxRegion: '',
  }), []);

  const [tax, setTax] = useState(initial);
  const [initialized, setInitialized] = useState(false);
  const safeSaving = !!saving;

  useEffect(() => {
    const t = values?.taxInfo || {};
    setTax({
      panNumber: (t.panNumber || '').toUpperCase(),
      gstNumber: (t.gstNumber || '').toUpperCase(),
      taxRegion: t.taxRegion || '',
    });
    setInitialized(true);
  }, [values]);

  const handleChange = (field, incoming) => {
    let value = '';
    try {
      if (incoming && typeof incoming === 'object') {
        if (Object.prototype.hasOwnProperty.call(incoming, 'target')) {
          value = incoming.target?.value ?? '';
        } else if (Object.prototype.hasOwnProperty.call(incoming, 'value')) {
          value = incoming.value ?? '';
        } else {
          value = `${incoming}`;
        }
      } else {
        value = incoming ?? '';
      }
    } catch (_) {
      value = '';
    }
    if (field === 'panNumber' || field === 'gstNumber') {
      value = value.toUpperCase();
    }
    setTax(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Regex (case-insensitive) — formats optional at this step (validate if present)
    const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/i;

    const pan = (tax.panNumber || '').trim();
    const gst = (tax.gstNumber || '').trim();

    // Step-level validity: BOTH PAN and GST are required and must match format
    const valid = PAN_RE.test(pan) && GST_RE.test(gst);
    onValidityChange?.(valid);

    const t0 = values?.taxInfo || {};
    const dirty = (
      (tax.panNumber || '') !== (t0.panNumber || '') ||
      (tax.gstNumber || '') !== (t0.gstNumber || '') ||
      (tax.taxRegion || '') !== (t0.taxRegion || '')
    );
    onDirtyChange?.(dirty);

    onPartialChange?.({
      taxInfo: {
        panNumber: pan,
        gstNumber: gst,
        taxRegion: (tax.taxRegion || '').trim(),
      },
      setupProgress: { taxInfo: true },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tax, values]);

  return (
    <div className="space-y-6">
      {initialized && (
        <>
          <CustomInput
            label="PAN Number"
            value={tax.panNumber}
            onChange={e => handleChange('panNumber', e)}
            disabled={safeSaving}
            placeholder="e.g., ABCDE1234F"
            required
            autoFocus
          />

          <CustomInput
            label="GST Number"
            value={tax.gstNumber}
            onChange={e => handleChange('gstNumber', e)}
            disabled={safeSaving}
            placeholder="e.g., 27ABCDE1234F1Z5"
            required
          />

          <CustomInput
            label="Tax Region (optional)"
            value={tax.taxRegion}
            onChange={e => handleChange('taxRegion', e)}
            disabled={safeSaving}
            placeholder="e.g., Maharashtra"
          />
        </>
      )}
    </div>
  );
}