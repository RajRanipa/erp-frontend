// src/app/(app)/parties/lib/partySchema.js
// Party schema helpers for frontend.
// - Pure JS (no React)
// - Provides: defaults + lightweight validation (no external libs)
// - Keeps validation UX-friendly (warn, not over-strict)

import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  PARTY_ROLES,
  PARTY_STATUS,
  PAYMENT_TERM_TYPES,
  normalizePartyRoles,
  isValidPartyRole,
  isValidPartyStatus,
} from './partyConstants';

// -----------------------------
// Regex (soft validation)
// -----------------------------

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const PHONE_RE = /^[0-9+\-() ]{6,20}$/;
// India GSTIN format (optional soft validation)
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
// India PAN format (optional soft validation)
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// -----------------------------
// Defaults (UI form)
// -----------------------------

export function emptyAddress(overrides = {}) {
  return {
    label: 'Office',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: DEFAULT_COUNTRY,
    pincode: '',
    isDefaultBilling: false,
    isDefaultShipping: false,
    ...overrides,
  };
}

export function emptyContact(overrides = {}) {
  return {
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false,
    ...overrides,
  };
}

export function defaultPartyForm(overrides = {}) {
  return {
    name: '',
    legalName: '',

    roles: [PARTY_ROLES.SUPPLIER],
    status: PARTY_STATUS.ACTIVE,

    phone: '',
    email: '',
    website: '',

    taxProfile: {
      isTaxRegistered: false,
      taxId: '',
      pan: '',
      placeOfSupply: '',
    },

    addresses: [],
    contacts: [],

    paymentTerms: {
      type: PAYMENT_TERM_TYPES.NET_DAYS,
      netDays: 30,
      note: '',
    },

    currency: DEFAULT_CURRENCY,
    creditLimit: '',

    notes: '',
    ...overrides,
  };
}

// -----------------------------
// Utilities
// -----------------------------

export function trimStr(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

export function asNullIfEmpty(v) {
  const s = trimStr(v);
  return s ? s : null;
}

export function ensureOnePrimaryContact(contacts = []) {
  const list = Array.isArray(contacts) ? contacts.map((c) => ({ ...emptyContact(), ...(c || {}) })) : [];
  const firstIdx = list.findIndex((c) => !!c.isPrimary);
  if (firstIdx === -1) return list;
  return list.map((c, i) => ({ ...c, isPrimary: i === firstIdx }));
}

export function ensureOneDefaultAddress(addresses = [], which = 'billing') {
  const flag = which === 'shipping' ? 'isDefaultShipping' : 'isDefaultBilling';
  const list = Array.isArray(addresses) ? addresses.map((a) => ({ ...emptyAddress(), ...(a || {}) })) : [];
  const firstIdx = list.findIndex((a) => !!a[flag]);
  if (firstIdx === -1) return list;
  return list.map((a, i) => ({ ...a, [flag]: i === firstIdx }));
}

// -----------------------------
// Validation
// -----------------------------

/**
 * validatePartyForm
 * - Returns { ok, errors }
 * - errors is a flat map keyed by path-like strings
 *
 * NOTE: This is intentionally not super strict (ERP data varies).
 */
export function validatePartyForm(form) {
  const f = form || {};
  const errors = {};

  // Name
  if (!trimStr(f.name)) {
    errors.name = 'Name is required';
  }

  // Roles
  const roles = normalizePartyRoles(f.roles);
  if (!roles.length) {
    errors.roles = 'At least one role is required';
  } else {
    const bad = roles.find((r) => !isValidPartyRole(r));
    if (bad) errors.roles = `Invalid role: ${bad}`;
  }

  // Status
  if (f.status && !isValidPartyStatus(f.status)) {
    errors.status = `Invalid status: ${f.status}`;
  }

  // Email (soft)
  const email = trimStr(f.email);
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Invalid email format';
  }

  // Phone (soft)
  const phone = trimStr(f.phone);
  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = 'Invalid phone format';
  }

  // Tax profile (soft)
  const taxId = trimStr(f?.taxProfile?.taxId);
  const pan = trimStr(f?.taxProfile?.pan);
  const isIndia = trimStr(f?.addresses?.[0]?.country || DEFAULT_COUNTRY).toLowerCase() === 'india';

  if (taxId && isIndia && taxId.length >= 10 && !GSTIN_RE.test(taxId.toUpperCase())) {
    errors['taxProfile.taxId'] = 'GSTIN looks invalid';
  }
  if (pan && isIndia && pan.length >= 10 && !PAN_RE.test(pan.toUpperCase())) {
    errors['taxProfile.pan'] = 'PAN looks invalid';
  }

  // Payment terms
  const pt = f.paymentTerms || {};
  const ptType = pt.type || PAYMENT_TERM_TYPES.NET_DAYS;
  if (!Object.values(PAYMENT_TERM_TYPES).includes(ptType)) {
    errors['paymentTerms.type'] = 'Invalid payment term type';
  }
  const netDays = Number(pt.netDays ?? 0);
  if (ptType === PAYMENT_TERM_TYPES.NET_DAYS) {
    if (!Number.isFinite(netDays) || netDays < 0 || netDays > 3650) {
      errors['paymentTerms.netDays'] = 'Net days must be between 0 and 3650';
    }
  }

  // Credit limit
  if (f.creditLimit !== '' && f.creditLimit !== null && f.creditLimit !== undefined) {
    const n = Number(f.creditLimit);
    if (!Number.isFinite(n) || n < 0) {
      errors.creditLimit = 'Credit limit must be a non-negative number';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors, roles };
}

/**
 * sanitizePartyForm
 * - Returns a cleaned UI form object (good before mapping -> payload)
 */
export function sanitizePartyForm(form) {
  const f = defaultPartyForm(form || {});

  const roles = normalizePartyRoles(f.roles);
  f.roles = roles.length ? roles : [PARTY_ROLES.SUPPLIER];

  // enforce single defaults
  f.contacts = ensureOnePrimaryContact(f.contacts);
  f.addresses = ensureOneDefaultAddress(ensureOneDefaultAddress(f.addresses, 'billing'), 'shipping');

  // normalize status
  if (!isValidPartyStatus(f.status)) f.status = PARTY_STATUS.ACTIVE;

  // normalize strings
  f.name = trimStr(f.name);
  f.legalName = trimStr(f.legalName);
  f.phone = trimStr(f.phone);
  f.email = trimStr(f.email);
  f.website = trimStr(f.website);
  f.notes = trimStr(f.notes);

  // tax
  f.taxProfile = {
    isTaxRegistered: !!f?.taxProfile?.isTaxRegistered,
    taxId: trimStr(f?.taxProfile?.taxId),
    pan: trimStr(f?.taxProfile?.pan),
    placeOfSupply: trimStr(f?.taxProfile?.placeOfSupply),
  };

  // payment
  f.paymentTerms = {
    type: Object.values(PAYMENT_TERM_TYPES).includes(f?.paymentTerms?.type)
      ? f.paymentTerms.type
      : PAYMENT_TERM_TYPES.NET_DAYS,
    netDays: Number.isFinite(Number(f?.paymentTerms?.netDays)) ? Number(f.paymentTerms.netDays) : 30,
    note: trimStr(f?.paymentTerms?.note),
  };

  f.currency = trimStr(f.currency) || DEFAULT_CURRENCY;

  return f;
}

// -----------------------------
// Payload helpers
// -----------------------------

/**
 * formToPayload
 * Basic conversion (keeps same shape you used in PartyForm.jsx).
 * If you prefer, use formToApiPartyPayload from partyMappers.js.
 */
export function formToPayload(form) {
  const f = sanitizePartyForm(form);

  return {
    name: trimStr(f.name),
    legalName: asNullIfEmpty(f.legalName),

    roles: f.roles,
    status: f.status,

    phone: asNullIfEmpty(f.phone),
    email: asNullIfEmpty(f.email),
    website: asNullIfEmpty(f.website),

    taxProfile: {
      isTaxRegistered: !!f.taxProfile.isTaxRegistered,
      taxId: asNullIfEmpty(f.taxProfile.taxId),
      pan: asNullIfEmpty(f.taxProfile.pan),
      placeOfSupply: trimStr(f.taxProfile.placeOfSupply) || '',
    },

    addresses: Array.isArray(f.addresses) ? f.addresses : [],
    contacts: Array.isArray(f.contacts) ? f.contacts : [],

    paymentTerms: {
      type: f.paymentTerms.type,
      netDays: Number(f.paymentTerms.netDays ?? 0),
      note: asNullIfEmpty(f.paymentTerms.note),
    },

    currency: trimStr(f.currency) || DEFAULT_CURRENCY,
    creditLimit: f.creditLimit === '' ? null : (Number.isFinite(Number(f.creditLimit)) ? Number(f.creditLimit) : null),

    notes: asNullIfEmpty(f.notes),
  };
}
