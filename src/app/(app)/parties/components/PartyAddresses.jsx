
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import AddButton from '@/Components/buttons/AddButton';
import { Toast } from '@/Components/toast';

const COUNTRY_OPTIONS = [
  { value: 'India', label: 'India' },
  { value: 'Other', label: 'Other' },
];

const PIN_RE = /^[1-9][0-9]{5}$/;

const PURPOSE_OPTIONS = [
  { value: 'billing', label: 'Billing' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'mailing', label: 'Mailing' },
  { value: 'registered', label: 'Registered' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'factory', label: 'Factory' },
  { value: 'other', label: 'Other' },
];

const LABEL_PRESETS = [
  'Office',
  'Registered',
  'Billing',
  'Shipping',
  'Warehouse',
  'Factory',
  'Mailing',
  'Other',
];

function isIndiaCountry(c) {
  const v = String(c || '').toLowerCase();
  return v === 'india' || v === 'in' || v === 'bharat';
}

function emptyAddress(label = 'Office') {
  return {
    label,
    purposes: [],
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  };
}

function normalizePurposes(arr) {
  return Array.from(
    new Set((arr || []).map((p) => String(p || '').trim().toLowerCase()).filter(Boolean))
  );
}

async function fetchIndiaPincode(pin, signal) {
  const url = `https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`;
  const r = await fetch(url, { method: 'GET', signal });
  if (!r.ok) throw new Error(`Pincode lookup failed (${r.status})`);
  const json = await r.json();
  const first = Array.isArray(json) ? json[0] : null;
  if (!first || first.Status !== 'Success' || !Array.isArray(first.PostOffice) || first.PostOffice.length === 0) {
    return null;
  }
  const po = first.PostOffice[0];
  return {
    city: po.District || po.Block || po.Name || '',
    state: po.State || '',
    country: 'India',
  };
}

function addressRequiredComplete(a) {
  const addr = a || {};
  return (
    String(addr.label || '').trim() &&
    String(addr.line1 || '').trim() &&
    String(addr.city || '').trim() &&
    String(addr.state || '').trim() &&
    String(addr.country || '').trim() &&
    String(addr.pincode || '').trim()
  );
}

function coerceValue(value) {
  // New shape expected: { primaryAddress, additionalAddresses }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const primaryAddress = value.primaryAddress || emptyAddress('Office');
    const additionalAddresses = Array.isArray(value.additionalAddresses) ? value.additionalAddresses : [];
    return { primaryAddress, additionalAddresses };
  }

  // Backward compat: old array -> first as primary, rest as additional
  if (Array.isArray(value)) {
    const first = value[0] || emptyAddress('Office');
    const rest = value.slice(1) || [];
    const primaryAddress = {
      ...emptyAddress(first?.label || 'Office'),
      ...first,
      // old model fields ignored
      purposes: normalizePurposes(first?.purposes || []),
    };
    const additionalAddresses = rest.map((a) => ({
      ...emptyAddress(a?.label || 'Office'),
      ...a,
      purposes: normalizePurposes(a?.purposes || []),
    }));
    return { primaryAddress, additionalAddresses };
  }

  return { primaryAddress: emptyAddress('Office'), additionalAddresses: [] };
}

export default function PartyAddresses({
  value,
  onChange,
  title = 'Addresses',
  disabled = false,
}) {
  const model = useMemo(() => coerceValue(value), [value]);
  const primary = model.primaryAddress || emptyAddress('Office');
  const additional = Array.isArray(model.additionalAddresses) ? model.additionalAddresses : [];

  const modelRef = useRef({ primaryAddress: primary, additionalAddresses: additional });
  useEffect(() => {
    modelRef.current = { primaryAddress: primary, additionalAddresses: additional };
  }, [primary, additional]);

  const emit = useCallback((next) => {
    if (!onChange) return;
    onChange(next);
  }, [onChange]);

  // Debounce + abort for pincode lookup (primary + modal draft)
  const pinAbortRef = useRef(new Map()); // key -> AbortController
  const pinTimerRef = useRef(new Map()); // key -> timeout

  const schedulePinLookup = useCallback(async (key, nextAddress, applyPatch) => {
    const pinRaw = String(nextAddress?.pincode || '').trim();
    const country = nextAddress?.country;

    // cancel previous debounce + request for this key
    const prevTimer = pinTimerRef.current.get(key);
    if (prevTimer) {
      try { clearTimeout(prevTimer); } catch {}
    }

    const prevAbort = pinAbortRef.current.get(key);
    if (prevAbort) {
      try { prevAbort.abort(); } catch {}
    }

    if (!isIndiaCountry(country)) return;
    if (!PIN_RE.test(pinRaw)) return;

    const t = setTimeout(async () => {
      const ctrl = new AbortController();
      pinAbortRef.current.set(key, ctrl);
      try {
        const info = await fetchIndiaPincode(pinRaw, ctrl.signal);
        if (!info) {
          Toast.error('Pincode not found.');
          return;
        }

        // Apply only if user still has same pincode/country
        const latest = modelRef.current;
        const cur = key === 'primary' ? (latest.primaryAddress || {}) : (latest.__draft || {});
        const stillPin = String(cur.pincode || '').trim();
        const stillCountry = cur.country;
        if (!isIndiaCountry(stillCountry) || stillPin !== pinRaw) return;

        const patch2 = {
          country: 'India',
          city: cur.city ? cur.city : info.city,
          state: cur.state ? cur.state : info.state,
        };

        applyPatch(patch2);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        console.error(e);
      }
    }, 500);

    pinTimerRef.current.set(key, t);
  }, []);

  const setPrimary = useCallback((patch) => {
    const latest = modelRef.current;
    const nextPrimary = { ...(latest.primaryAddress || emptyAddress('Office')), ...(patch || {}) };

    const next = {
      primaryAddress: nextPrimary,
      additionalAddresses: Array.isArray(latest.additionalAddresses) ? latest.additionalAddresses : [],
    };

    modelRef.current = next;
    emit(next);

    if (patch && Object.prototype.hasOwnProperty.call(patch, 'pincode')) {
      schedulePinLookup('primary', nextPrimary, (patch2) => {
        const l = modelRef.current;
        const merged = {
          primaryAddress: { ...(l.primaryAddress || {}), ...patch2 },
          additionalAddresses: l.additionalAddresses || [],
        };
        modelRef.current = merged;
        emit(merged);
      });
    }
  }, [emit, schedulePinLookup]);

  // Modal wizard for additional address
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => emptyAddress('Office'));

  // Keep draft in ref so pin lookup can read latest
  useEffect(() => {
    // stash draft for pin lookup validation
    modelRef.current = { ...modelRef.current, __draft: draft };
  }, [draft]);

  const openModal = useCallback(() => {
    if (disabled) return;
    setDraft(emptyAddress('Office'));
    setStep(1);
    setOpen(true);
  }, [disabled]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setStep(1);
  }, []);

  const togglePurpose = useCallback((p) => {
    setDraft((prev) => {
      const cur = normalizePurposes(prev?.purposes);
      const has = cur.includes(p);
      const nextPurposes = has ? cur.filter(x => x !== p) : [...cur, p];
      return { ...(prev || {}), purposes: nextPurposes };
    });
  }, []);

  const setDraftAt = useCallback((patch) => {
    setDraft((prev) => {
      const nextAddr = { ...(prev || {}), ...(patch || {}) };
      // If pincode changes for India, clear city/state so it can be re-derived
      if (patch && Object.prototype.hasOwnProperty.call(patch, 'pincode')) {
        const pin = String(nextAddr.pincode || '').trim();
        if (isIndiaCountry(nextAddr.country)) {
          nextAddr.pincode = pin.replace(/\D/g, '').slice(0, 6);
          nextAddr.city = '';
          nextAddr.state = '';
        }
      }
      return nextAddr;
    });

    if (patch && Object.prototype.hasOwnProperty.call(patch, 'pincode')) {
      const nextAddress = { ...(draft || {}), ...(patch || {}) };
      schedulePinLookup('draft', nextAddress, (patch2) => {
        setDraft((prev) => ({ ...(prev || {}), ...patch2 }));
      });
    }
  }, [draft, schedulePinLookup]);

  const enforceUniquePurpose = useCallback((list, purpose) => {
    // remove the purpose from all addresses except the last one (newly added)
    if (!purpose) return list;
    const lastIdx = list.length - 1;
    return list.map((a, i) => {
      const pur = normalizePurposes(a?.purposes);
      if (i === lastIdx) return { ...(a || {}), purposes: pur };
      if (!pur.includes(purpose)) return a;
      return { ...(a || {}), purposes: pur.filter((x) => x !== purpose) };
    });
  }, []);

  const saveDraft = useCallback(() => {
    const d = { ...(draft || {}) };
    d.purposes = normalizePurposes(d.purposes);

    // Minimal required fields for saving an additional address
    if (!addressRequiredComplete(d)) {
      Toast.error('Please fill required address fields before saving.');
      return;
    }

    if (!d.purposes || d.purposes.length === 0) {
      Toast.error('Please select at least one purpose (Billing/Shipping/etc.).');
      return;
    }

    const latest = modelRef.current;
    const nextList = [...(latest.additionalAddresses || []), d];

    // Enforce unique billing and shipping across additional addresses
    let normalized = nextList;
    if (d.purposes.includes('billing')) normalized = enforceUniquePurpose(normalized, 'billing');
    if (d.purposes.includes('shipping')) normalized = enforceUniquePurpose(normalized, 'shipping');

    const next = {
      primaryAddress: latest.primaryAddress || emptyAddress('Office'),
      additionalAddresses: normalized,
    };

    modelRef.current = next;
    emit(next);

    Toast.success('Address added');
    closeModal();
  }, [draft, emit, closeModal, enforceUniquePurpose]);

  const removeAdditional = useCallback((idx) => {
    const latest = modelRef.current;
    const list = Array.isArray(latest.additionalAddresses) ? latest.additionalAddresses : [];
    const nextList = list.filter((_, i) => i !== idx);
    const next = { primaryAddress: latest.primaryAddress || emptyAddress('Office'), additionalAddresses: nextList };
    modelRef.current = next;
    emit(next);
  }, [emit]);

  const summaryPurposes = useCallback((purposes) => {
    const p = normalizePurposes(purposes);
    return p;
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="mb-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-secondary-text/70">
            Primary address is used by default. Add extra addresses for Billing / Shipping / Mailing if needed.
          </p>
        </div>

        <AddButton title="Add another address" onClick={openModal} size="sm" disabled={disabled} />
      </div>

      {/* Primary Address (inline) */}
      <div className="border border-white-100 rounded-lg p-3 bg-white-100/40">
        <div className="text-sm font-medium">Primary Address</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <SelectInput
            label="Country"
            value={primary.country || 'India'}
            onChange={(e) => setPrimary({ country: e.target.value })}
            options={COUNTRY_OPTIONS}
            disabled={disabled}
          />

          <CustomInput
            label="Pincode"
            value={primary.pincode || ''}
            onChange={(e) => {
              const raw = String(e.target.value || '');
              const digits = raw.replace(/\D/g, '').slice(0, 6);
              if (isIndiaCountry(primary.country)) setPrimary({ pincode: digits, city: '', state: '' });
              else setPrimary({ pincode: raw });
            }}
            placeholder="380015"
            disabled={disabled}
          />

          <CustomInput
            label="Label"
            value={primary.label || 'Office'}
            onChange={(e) => setPrimary({ label: e.target.value })}
            placeholder="Office"
            disabled={disabled}
          />

          <CustomInput
            label="Address Line 1"
            value={primary.line1 || ''}
            onChange={(e) => setPrimary({ line1: e.target.value })}
            placeholder="Street / Area"
            disabled={disabled}
          />

          <CustomInput
            label="Address Line 2"
            value={primary.line2 || ''}
            onChange={(e) => setPrimary({ line2: e.target.value })}
            placeholder="Landmark"
            disabled={disabled}
          />

          <CustomInput
            label="City"
            value={primary.city || ''}
            onChange={(e) => setPrimary({ city: e.target.value })}
            placeholder="Ahmedabad"
            disabled={disabled}
          />

          <CustomInput
            label="State"
            value={primary.state || ''}
            onChange={(e) => setPrimary({ state: e.target.value })}
            placeholder="Gujarat"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Additional Addresses */}
      {additional.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Additional Addresses</div>
          <div className="space-y-3">
            {additional.map((a, idx) => {
              const ps = summaryPurposes(a?.purposes);
              return (
                <div key={idx} className="border border-white-100 rounded-lg p-3 bg-white-100/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{a?.label || `Address #${idx + 1}`}</div>
                      <div className="text-xs text-secondary-text/70">
                        {(a?.city || '')}{a?.state ? `, ${a.state}` : ''}{a?.pincode ? ` - ${a.pincode}` : ''}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ps.map((p) => (
                          <span key={p} className="text-xs px-2 py-0.5 rounded bg-white-200 border border-white-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-500 bg-red-500/10 px-2 py-1"
                      onClick={() => removeAdditional(idx)}
                      disabled={disabled}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-secondary border border-white-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white-200">
              <div className="font-semibold">Add Address</div>
              <button type="button" className="text-sm px-2 py-1" onClick={closeModal}>✕</button>
            </div>

            <div className="p-4">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Choose label</div>
                    <div className="flex flex-wrap gap-2">
                      {LABEL_PRESETS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setDraftAt({ label: l })}
                          className={`text-xs px-3 py-1 rounded border ${String(draft.label || 'Office') === l ? 'bg-white-200 border-action' : 'bg-white-100 border-white-200'}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    {String(draft.label || '') === 'Other' && (
                      <div className="mt-3">
                        <CustomInput
                          label="Custom label"
                          value={draft.labelCustom || ''}
                          onChange={(e) => setDraftAt({ labelCustom: e.target.value })}
                          placeholder="e.g., Branch Office"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Purposes</div>
                    <div className="flex flex-wrap gap-2">
                      {PURPOSE_OPTIONS.map((p) => {
                        const has = normalizePurposes(draft.purposes).includes(p.value);
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => togglePurpose(p.value)}
                            className={`text-xs px-3 py-1 rounded border ${has ? 'bg-white-200 border-action' : 'bg-white-100 border-white-200'}`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1 text-xs text-secondary-text/70">
                      Tip: Keep Billing and Shipping separate only if needed.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" className="px-3 py-2 text-sm border rounded" onClick={closeModal}>Cancel</button>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded bg-action text-white"
                      onClick={() => {
                        const chosenLabel = String(draft.label || 'Office');
                        const finalLabel = chosenLabel === 'Other' ? (String(draft.labelCustom || '').trim() || 'Other') : chosenLabel;
                        setDraft((prev) => ({ ...(prev || {}), label: finalLabel }));
                        setStep(2);
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <SelectInput
                      label="Country"
                      value={draft.country || 'India'}
                      onChange={(e) => setDraftAt({ country: e.target.value })}
                      options={COUNTRY_OPTIONS}
                    />

                    <CustomInput
                      label="Pincode"
                      value={draft.pincode || ''}
                      onChange={(e) => {
                        const raw = String(e.target.value || '');
                        const digits = raw.replace(/\D/g, '').slice(0, 6);
                        if (isIndiaCountry(draft.country)) setDraftAt({ pincode: digits, city: '', state: '' });
                        else setDraftAt({ pincode: raw });
                      }}
                      placeholder="380015"
                    />

                    <CustomInput
                      label="Label"
                      value={draft.label || ''}
                      onChange={(e) => setDraftAt({ label: e.target.value })}
                      placeholder="Office"
                    />

                    <CustomInput
                      label="Address Line 1"
                      value={draft.line1 || ''}
                      onChange={(e) => setDraftAt({ line1: e.target.value })}
                      placeholder="Street / Area"
                    />

                    <CustomInput
                      label="Address Line 2"
                      value={draft.line2 || ''}
                      onChange={(e) => setDraftAt({ line2: e.target.value })}
                      placeholder="Landmark"
                    />

                    <CustomInput
                      label="City"
                      value={draft.city || ''}
                      onChange={(e) => setDraftAt({ city: e.target.value })}
                      placeholder="Ahmedabad"
                    />

                    <CustomInput
                      label="State"
                      value={draft.state || ''}
                      onChange={(e) => setDraftAt({ state: e.target.value })}
                      placeholder="Gujarat"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" className="px-3 py-2 text-sm border rounded" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-3 py-2 text-sm border rounded" onClick={closeModal}>Cancel</button>
                      <button type="button" className="px-3 py-2 text-sm rounded bg-action text-white" onClick={saveDraft}>
                        Add Address
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
