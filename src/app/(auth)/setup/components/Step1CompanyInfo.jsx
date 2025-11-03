'use client';
import React, { useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

export default function Step1CompanyInfo({ values = {}, saving, onValidityChange, onDirtyChange, onPartialChange }) {
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    email: '',
    phone: '',
  });
  const [initialized, setInitialized] = useState(false);

  const safeSaving = !!saving;
  const industryOptions = useMemo(() => ([
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Retail', value: 'retail' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Education', value: 'education' },
    { label: 'Tech', value: 'tech' },
    { label: 'Finance', value: 'finance' },
    { label: 'Real Estate', value: 'real-estate' },
    { label: 'Logistics', value: 'logistics' },
    { label: 'Other', value: 'other' },
  ]), []);

  useEffect(() => {
    setForm({
      companyName: values.companyName || '',
      industry: values.industry || '',
      email: values.email || '',
      phone: values.phone || '',
    });
    setInitialized(true);
  }, [values]);

  useEffect(() => {
    const valid = !!form.companyName.trim();
    onValidityChange?.(valid);

    const dirty = (
      (form.companyName || '') !== (values.companyName || '') ||
      (form.industry || '') !== (values.industry || '') ||
      (form.email || '') !== (values.companyEmail || '') ||
      (form.phone || '') !== (values.phone || '')
    );
    onDirtyChange?.(dirty);
    console.log('form', form);
    onPartialChange?.({
      companyName: form.companyName.trim(),
      industry: form.industry.trim(),
      companyEmail: form.email.trim(),
      phone: form.phone,
    });
    // setForm(prev => ({ ...prev, companyName: form.companyName.trim(), industry: form.industry.trim(), companyEmail: form.email.trim(), phone: form.phone }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, values]);

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
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
    <>
      {initialized && (
        <>
          <div>
            <CustomInput
              label="Company Name"
              required
              value={form.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
              disabled={safeSaving}
              placeholder="Enter your company name"
            />
          </div>

          <SelectTypeInput
            label="Industry"
            value={form.industry}
            onChange={(val) => handleChange('industry', val)}
            disabled={safeSaving}
            placeholder="e.g., Manufacturing, Retail, etc."
            options={industryOptions}
            required
            allowCustomValue={true}
          />

          <CustomInput
            label="Company Email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            disabled={safeSaving}
            placeholder="e.g., info@company.com"
            required
          />

          <CustomInput
            label="Phone Number"
            value={form.phone}
            onChange={e => handleChange('phone', e.target.value)}
            disabled={safeSaving}
            placeholder="e.g., +91 98765 43210"
            required
          />
        </>
      )}
    </>
    </div>
  );
}
