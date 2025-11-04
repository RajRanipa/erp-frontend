'use client';
import React, { useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

/**
 * Step2Address — collects company address details.
 *
 * Props:
 * - values: full company object (expects values.address)
 * - saving: boolean (disable inputs/buttons while saving)
 * - onValidityChange: (boolean) => void
 * - onDirtyChange: (boolean) => void
 * - onPartialChange: (partialPayload) => void
 */
export default function Step2Address({ values = {}, saving, onValidityChange, onDirtyChange, onPartialChange }) {
  const initial = {
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  };

  const [addr, setAddr] = useState(initial);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const safeSaving = !!saving;

  useEffect(() => {
    const a = values?.address || {};
    console.log('address', a);
    setAddr({
      street: a.street || '',
      city: a.city || '',
      state: a.state || '',
      country: a.country || '',
      postalCode: a.postalCode || '',
    });
    setInitialized(true);
  }, [values]);

  useEffect(() => {
    // Valid when country present (you can tighten later if needed)
    const valid = !!(addr.country || '').trim();
    onValidityChange?.(valid);

    const a = values?.address || {};
    const dirty = (
      (addr.street || '') !== (a.street || '') ||
      (addr.city || '') !== (a.city || '') ||
      (addr.state || '') !== (a.state || '') ||
      (addr.country || '') !== (a.country || '') ||
      (addr.postalCode || '') !== (a.postalCode || '')
    );
    onDirtyChange?.(dirty);

    onPartialChange?.({
      address: {
        street: (addr.street || '').trim(),
        city: (addr.city || '').trim(),
        state: (addr.state || '').trim(),
        country: (addr.country || '').trim(),
        postalCode: (addr.postalCode || '').trim(),
      },
      setupProgress: { address: true },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr, values]);

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
      // console.log('value', value);
    } catch (_) {
      value = '';
    }
    setAddr(prev => ({ ...prev, [field]: value }));
  };

  const stateOptions = useMemo(
    () =>
      [
        'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Delhi', 'Punjab', 'Haryana', 'Chandigarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Puducherry', 'Lakshadweep', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Telangana', 'Kerala', 'Goa', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Jharkhand', 'Odisha', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'
      ].map(s => ({ label: s, value: s.toLowerCase() })),
    []
  );

  const countryOptions = useMemo(
    () =>
      [
        'India', 'United States', 'United Kingdom', 'Canada', 'Australia'
      ].map(s => ({ label: s, value: s.toLowerCase() })),
    []
  );

  return (
    <div className="space-y-6">
      {initialized && (
        <>
          <CustomInput
            label="Street Address"
            value={addr.street}
            onChange={e => handleChange('street', e)}
            disabled={safeSaving}
            placeholder="e.g., 221B Baker Street"
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="City"
              value={addr.city}
              onChange={e => handleChange('city', e)}
              disabled={safeSaving}
              placeholder="e.g., Mumbai"
              required
            />
            <SelectTypeInput
              label="State / Province"
              value={addr.state}
              onChange={(val) => handleChange('state', val)}
              disabled={safeSaving}
              placeholder="e.g., Maharashtra"
              options={stateOptions}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectTypeInput
              label="Country"
              value={addr.country}
              onChange={(val) => handleChange('country', val)}
              disabled={safeSaving}
              placeholder="e.g., India"
              options={countryOptions}
              required
            />
            <CustomInput
              label="Postal Code"
              value={addr.postalCode}
              onChange={e => handleChange('postalCode', e)}
              disabled={safeSaving}
              placeholder="e.g., 400001"
              required
            />
          </div>
        </>
      )}
    </div>
  );
}