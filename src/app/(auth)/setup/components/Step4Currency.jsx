// src/app/(auth)/setup/components/Step4Currency.jsx

'use client';
import React, { useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

/**
 * Step4Currency — localization settings: currency, timezone, (optional) date format & fiscal year start.
 *
 * Props (WizardShell contract):
 * - values: full company object
 * - saving: boolean
 * - onValidityChange: (boolean) => void
 * - onDirtyChange: (boolean) => void
 * - onPartialChange: (partial) => void
 */
export default function Step4Currency({ values = {}, saving, onValidityChange, onDirtyChange, onPartialChange }) {
  const initial = useMemo(() => ({
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: 'April',
  }), []);

  const [loc, setLoc] = useState(initial);
  const [initialized, setInitialized] = useState(false);
  const safeSaving = !!saving;

  // --- Memoized options ---
  const currencyOptions = useMemo(
    () => ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'].map(v => ({ value: v, label: v })),
    []
  );

  const dateFormatOptions = useMemo(
    () => ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(v => ({ value: v, label: v })),
    []
  );

  const fiscalYearOptions = useMemo(
    () => (
      ['January','February','March','April','May','June','July','August','September','October','November','December']
        .map(v => ({ value: v, label: v }))
    ),
    []
  );

  // You could replace this with a full tz list later; keep it free-text for now.
  const timeZonePlaceholder = 'e.g., Asia/Kolkata';

  // --- Hydrate from incoming values ---
  useEffect(() => {
    setLoc(prev => ({
      ...prev,
      currency: values.currency || prev.currency,
      timezone: values.timezone || prev.timezone,
      dateFormat: values.dateFormat || prev.dateFormat,
      fiscalYearStart: values.fiscalYearStart || prev.fiscalYearStart,
    }));
    setInitialized(true);
  }, [values]);

  // --- Defensive change normalizer ---
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
    setLoc(p => ({ ...p, [field]: value }));
  };

  // --- Emit validity/dirty/partial up to the shell ---
  useEffect(() => {
    const curr = (loc.currency || '').trim();
    const tz = (loc.timezone || '').trim();

    // Required at this step: currency + timezone
    const valid = !!curr && !!tz;
    onValidityChange?.(valid);

    const v = values || {};
    const dirty = (
      (loc.currency || '') !== (v.currency || '') ||
      (loc.timezone || '') !== (v.timezone || '') ||
      (loc.dateFormat || '') !== (v.dateFormat || '') ||
      (loc.fiscalYearStart || '') !== (v.fiscalYearStart || '')
    );
    onDirtyChange?.(dirty);

    onPartialChange?.({
      currency: curr,
      timezone: tz,
      dateFormat: (loc.dateFormat || '').trim(),
      fiscalYearStart: (loc.fiscalYearStart || '').trim(),
      setupProgress: { localization: true },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, values]);

  return (
    <div className="space-y-6">
      {initialized && (
        <>
          <div>
            <SelectTypeInput
              label="Base Currency"
              value={loc.currency}
              onChange={(val) => handleChange('currency', val)}
              disabled={safeSaving}
              options={currencyOptions}
              placeholder="e.g., INR, USD"
              required
              autoFocus
            />
          </div>

          <div>
            <CustomInput
              label="Timezone"
              value={loc.timezone}
              onChange={e => handleChange('timezone', e)}
              disabled={safeSaving}
              placeholder={timeZonePlaceholder}
              required
            />
          </div>

          <SelectTypeInput
            label="Date Format (optional)"
            options={dateFormatOptions}
            value={loc.dateFormat}
            onChange={(val) => handleChange('dateFormat', val)}
            disabled={safeSaving}
            placeholder="e.g., DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD"
          />

          <SelectTypeInput
            label="Fiscal Year Start (optional)"
            value={loc.fiscalYearStart}
            onChange={(val) => handleChange('fiscalYearStart', val)}
            disabled={safeSaving}
            options={fiscalYearOptions}
            placeholder="e.g., April"
          />
        </>
      )}
    </div>
  );
}