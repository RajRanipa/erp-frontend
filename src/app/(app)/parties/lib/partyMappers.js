// src/app/(app)/parties/lib/partyMappers.js
// Pure mapping helpers between API Party shape and UI/form shape.
// Keep this file React-free.

import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  PAYMENT_TERM_TYPES,
  PARTY_STATUS,
  normalizePartyRoles,
} from './partyConstants';

// -----------------------------
// Basic helpers
// -----------------------------

export function toStr(v, fallback = '') {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

export function toTrimmedOrNull(v) {
  const s = toStr(v, '').trim();
  return s ? s : null;
}

export function toNumberOrNull(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toBool(v) {
  return !!v;
}

// -----------------------------
// Address/contact normalizers
// -----------------------------

export function normalizeAddress(a = {}) {
  return {
    label: toStr(a.label || 'Office'),
    line1: toStr(a.line1),
    line2: toStr(a.line2),
    city: toStr(a.city),
    state: toStr(a.state),
    country: toStr(a.country || DEFAULT_COUNTRY),
    pincode: toStr(a.pincode),
    isDefaultBilling: toBool(a.isDefaultBilling),
    isDefaultShipping: toBool(a.isDefaultShipping),
  };
}

export function normalizeContact(c = {}) {
  return {
    name: toStr(c.name),
    designation: toStr(c.designation),
    phone: toStr(c.phone),
    email: toStr(c.email),
    isPrimary: toBool(c.isPrimary),
  };
}

export function ensureSinglePrimaryContact(contacts = []) {
  const list = (contacts || []).map(normalizeContact);
  const firstPrimaryIdx = list.findIndex((x) => x.isPrimary);
  if (firstPrimaryIdx === -1) return list;
  return list.map((c, i) => ({ ...c, isPrimary: i === firstPrimaryIdx }));
}

export function ensureSingleDefaultAddress(addresses = [], key = 'billing') {
  const list = (addresses || []).map(normalizeAddress);
  const flag = key === 'shipping' ? 'isDefaultShipping' : 'isDefaultBilling';
  const firstIdx = list.findIndex((a) => a[flag]);
  if (firstIdx === -1) return list;
  return list.map((a, i) => ({ ...a, [flag]: i === firstIdx }));
}

// -----------------------------
// UI form mapping
// -----------------------------

/**
 * API Party -> UI Form Party
 * Produces a UI-safe object for PartyForm initialValues.
 */
export function apiPartyToForm(party = {}) {
  const p = party || {};

  const roles = normalizePartyRoles(p.roles);

  const addresses = (Array.isArray(p.addresses) ? p.addresses : []).map(normalizeAddress);
  const contacts = (Array.isArray(p.contacts) ? p.contacts : []).map(normalizeContact);

  return {
    _id: p._id,

    name: toStr(p.name),
    legalName: toStr(p.legalName),

    roles: roles.length ? roles : ['SUPPLIER'],
    status: toStr(p.status || PARTY_STATUS.ACTIVE),

    phone: toStr(p.phone),
    email: toStr(p.email),
    website: toStr(p.website),

    taxProfile: {
      isTaxRegistered: toBool(p?.taxProfile?.isTaxRegistered),
      taxId: toStr(p?.taxProfile?.taxId),
      pan: toStr(p?.taxProfile?.pan),
      placeOfSupply: toStr(p?.taxProfile?.placeOfSupply),
    },

    addresses: ensureSingleDefaultAddress(ensureSingleDefaultAddress(addresses, 'billing'), 'shipping'),
    contacts: ensureSinglePrimaryContact(contacts),

    paymentTerms: {
      type: toStr(p?.paymentTerms?.type || PAYMENT_TERM_TYPES.NET_DAYS),
      netDays: Number.isFinite(Number(p?.paymentTerms?.netDays)) ? Number(p.paymentTerms.netDays) : 30,
      note: toStr(p?.paymentTerms?.note),
    },

    currency: toStr(p.currency || DEFAULT_CURRENCY),
    creditLimit: p.creditLimit === undefined || p.creditLimit === null ? '' : Number(p.creditLimit),

    notes: toStr(p.notes),
  };
}

/**
 * UI Form Party -> API payload
 * Produces a backend-ready payload.
 */
export function formToApiPartyPayload(form = {}) {
  const f = form || {};

  const roles = normalizePartyRoles(f.roles);

  const addresses = ensureSingleDefaultAddress(
    ensureSingleDefaultAddress((Array.isArray(f.addresses) ? f.addresses : []).map(normalizeAddress), 'billing'),
    'shipping'
  );

  const contacts = ensureSinglePrimaryContact((Array.isArray(f.contacts) ? f.contacts : []).map(normalizeContact));

  return {
    name: toStr(f.name).trim(),
    legalName: toTrimmedOrNull(f.legalName),

    roles: roles.length ? roles : ['SUPPLIER'],
    status: toStr(f.status || PARTY_STATUS.ACTIVE),

    phone: toTrimmedOrNull(f.phone),
    email: toTrimmedOrNull(f.email),
    website: toTrimmedOrNull(f.website),

    taxProfile: {
      isTaxRegistered: toBool(f?.taxProfile?.isTaxRegistered),
      taxId: toTrimmedOrNull(f?.taxProfile?.taxId),
      pan: toTrimmedOrNull(f?.taxProfile?.pan),
      placeOfSupply: toStr(f?.taxProfile?.placeOfSupply || '').trim() || '',
    },

    addresses,
    contacts,

    paymentTerms: {
      type: toStr(f?.paymentTerms?.type || PAYMENT_TERM_TYPES.NET_DAYS),
      netDays: Number(f?.paymentTerms?.netDays ?? 0),
      note: toTrimmedOrNull(f?.paymentTerms?.note),
    },

    currency: toStr(f.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY,
    creditLimit: toNumberOrNull(f.creditLimit),

    notes: toTrimmedOrNull(f.notes),
  };
}

// -----------------------------
// Options mapping
// -----------------------------

/**
 * Party row -> dropdown option
 * { value, label, raw }
 */
export function partyToOption(p = {}) {
  const name = toStr(p?.name || p?.legalName || 'Unnamed');
  const taxId = p?.taxProfile?.taxId ? ` • ${p.taxProfile.taxId}` : '';
  const phone = p?.phone ? ` • ${p.phone}` : '';

  return {
    value: p._id,
    label: `${name}${taxId}${phone}`,
    raw: p,
  };
}
