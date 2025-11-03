// src/app/(auth)/setup/components/Step7Review.jsx
'use client';
import React from 'react';

/**
 * Step7Review — read-only summary before finishing setup.
 *
 * Props:
 * - values: full company object
 * - saving: boolean
 * - onBack: () => void (optional)
 * - onSave: (partialPayload) => Promise (optional; not required here)
 * - onNext: () => void (ignored here)
 */
export default function Step7Review({ values = {}, saving, onBack }) {
  const v = values || {};
  console.log('v', v)
  const address = v.address || {};
  const tax = v.taxInfo || {};

  // Normalize possible Google Drive links (viewer/open) to direct content URL
  const normalizeLogoUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      const u = url.trim();
      // Already a direct uc link
      if (u.includes('/uc?')) return u;

      // Patterns we support:
      // 1) https://drive.google.com/file/d/{id}/view?usp=sharing
      const m1 = u.match(/drive\.google\.com\/file\/d\/([^/]+)\//i);
      if (m1 && m1[1]) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;

      // 2) https://drive.google.com/open?id={id}
      const m2 = u.match(/[?&]id=([^&]+)/i);
      if (u.includes('drive.google.com') && m2 && m2[1]) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;

      return u;
    } catch (_) {
      return '';
    }
  };

  const logoSrc = normalizeLogoUrl(v.logoUrl);
  console.log('logoSrc', logoSrc) // logoSrc https://drive.google.com/uc?export=view&id=1Ipkvmza_DTmAHwKdfNUnrc9I78L0muiz
  const rows = [
    { label: 'Company Name', value: v.companyName || '—' },
    { label: 'Industry', value: v.industry || '—' },
    { label: 'Email', value: v.email || '—' },
    { label: 'Phone', value: v.phone || '—' },
  ];

  const addrRows = [
    { label: 'Street', value: address.street || '—' },
    { label: 'City', value: address.city || '—' },
    { label: 'State', value: address.state || '—' },
    { label: 'Country', value: address.country || '—' },
    { label: 'Postal Code', value: address.postalCode || '—' },
  ];

  const taxRows = [
    { label: 'PAN Number', value: tax.panNumber || '—' },
    { label: 'GST Number', value: tax.gstNumber || '—' },
    { label: 'Tax Region', value: tax.taxRegion || '—' },
  ];

  return (
    <div className="space-y-6 flex flex-wrap gap-3">
      <p className="text-sm text-white-400">Please review your company details below. If something looks off, use the sidebar to jump back and edit the step. When everything looks good, click <strong>Finish Setup</strong>.</p>

      {/* Company */}
      <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Company</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(r => (
            <div key={r.label} className="flex flex-col">
              <dt className="text-xs text-primary-text">{r.label}</dt>
              <dd className="text-sm">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Address */}
      <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Address</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addrRows.map(r => (
            <div key={r.label} className="flex flex-col">
              <dt className="text-xs text-primary-text">{r.label}</dt>
              <dd className="text-sm">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Tax */}
      <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Tax</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {taxRows.map(r => (
            <div key={r.label} className="flex flex-col">
              <dt className="text-xs text-primary-text">{r.label}</dt>
              <dd className="text-sm">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Localization */}
      <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Localization</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <dt className="text-xs text-primary-text">Currency</dt>
            <dd className="text-sm text-most-text">{v.currency || '—'}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-primary-text">Timezone</dt>
            <dd className="text-sm text-most-text">{v.timezone || '—'}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-primary-text">Date Format</dt>
            <dd className="text-sm text-most-text">{v.dateFormat || '—'}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-primary-text">Fiscal Year Start</dt>
            <dd className="text-sm text-most-text">{v.fiscalYearStart || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Modules */}
      <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Enabled Modules</h3>
        <div className="flex flex-wrap gap-2">
          {(v.enabledModules || []).length ? (
            v.enabledModules.map(m => (
              <span key={m} className="px-2 py-1 text-xs bg-white-100 border border-color-200 rounded-sm text-most-text">{m}</span>
            ))
          ) : (
            <span className="text-sm text-primary-text">No modules selected</span>
          )}
        </div>
      </section>

      {/* Logo */}
      {logoSrc && <section className="border rounded-lg p-4 border-color-100 flex-1 min-w-fit">
        <h3 className="font-semibold mb-3">Logo</h3>
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="Company logo"
            className="h-16 flex-1 min-w-fit object-contain"
            referrerPolicy="no-referrer"
            // onError={(e) => {
            //   // fallback: hide broken image and show text
            //   try { e.currentTarget.style.display = 'none'; } catch (_) {}
            //   const fallback = e.currentTarget?.nextElementSibling;
            //   if (fallback) fallback.style.display = 'inline-block';
            // }}
          />
        ) : null}
        <span className="text-sm text-primary-text" style={{display: logoSrc ? 'none' : 'inline-block'}}>
          No logo uploaded or image not accessible
        </span>
      </section>}
    </div>
  );
}