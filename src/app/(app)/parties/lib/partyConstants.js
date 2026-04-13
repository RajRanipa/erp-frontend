

// src/app/(app)/parties/lib/partyConstants.js
// Central place for all Party-related constants.
// Keep this file PURE (no React, no hooks).

// -----------------------------
// Party Roles
// -----------------------------
export const PARTY_ROLES = Object.freeze({
  SUPPLIER: 'SUPPLIER',
  CUSTOMER: 'CUSTOMER',
  TRANSPORTER: 'TRANSPORTER',
  JOBWORKER: 'JOBWORKER',
  BROKER: 'BROKER',
  OTHER: 'OTHER',
});

export const PARTY_ROLE_OPTIONS = [
  { value: PARTY_ROLES.SUPPLIER, label: 'Supplier' },
  { value: PARTY_ROLES.CUSTOMER, label: 'Customer' },
  { value: PARTY_ROLES.TRANSPORTER, label: 'Transporter' },
  { value: PARTY_ROLES.JOBWORKER, label: 'Job Worker' },
  { value: PARTY_ROLES.BROKER, label: 'Broker' },
  { value: PARTY_ROLES.OTHER, label: 'Other' },
];

export const TAX_REGISTERED_OPTIONS = [
  { value: "yes", label: 'yes' },
  { value: "no", label: 'no' },
];

// -----------------------------
// Party Status
// -----------------------------
export const PARTY_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived', // optional, future-safe
});

export const PARTY_STATUS_OPTIONS = [
  { value: PARTY_STATUS.ACTIVE, label: 'Active' },
  { value: PARTY_STATUS.INACTIVE, label: 'Inactive' },
];

// -----------------------------
// Payment Terms
// -----------------------------
export const PAYMENT_TERM_TYPES = Object.freeze({
  NET_DAYS: 'NET_DAYS',
  DUE_ON_RECEIPT: 'DUE_ON_RECEIPT',
  CUSTOM: 'CUSTOM',
});

export const PAYMENT_TERM_TYPE_OPTIONS = [
  { value: PAYMENT_TERM_TYPES.NET_DAYS, label: 'Net Days' },
  { value: PAYMENT_TERM_TYPES.DUE_ON_RECEIPT, label: 'Due on Receipt' },
  { value: PAYMENT_TERM_TYPES.CUSTOM, label: 'Custom' },
];

// -----------------------------
// Address Defaults
// -----------------------------
export const DEFAULT_COUNTRY = 'India';
export const DEFAULT_CURRENCY = 'INR';

export const ADDRESS_LABELS = [
  'Office',
  'Billing',
  'Shipping',
  'Warehouse',
];

// -----------------------------
// Tax / Compliance
// -----------------------------
export const TAX_ID_TYPES = Object.freeze({
  GSTIN: 'GSTIN', // India
  VAT: 'VAT',
  OTHER: 'OTHER',
});

// India states / UTs (for Place of Supply)
export const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];

// -----------------------------
// Helpers (non-React)
// -----------------------------

export function normalizePartyRoles(input = []) {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter(Boolean)));
}

export function isValidPartyStatus(status) {
  return Object.values(PARTY_STATUS).includes(status);
}

export function isValidPartyRole(role) {
  return Object.values(PARTY_ROLES).includes(role);
}