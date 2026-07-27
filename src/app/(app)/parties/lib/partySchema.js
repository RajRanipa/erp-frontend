import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  PARTY_LIFECYCLE,
  PARTY_PRIORITY,
  PARTY_ROLES,
  PARTY_STATUS,
  PARTY_TYPES,
  PAYMENT_TERM_TYPES,
  PREFERRED_CHANNELS,
  TAX_ID_TYPES,
  isValidPartyRole,
  isValidPartyStatus,
  normalizePartyRoles,
} from './partyConstants';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const PHONE_RE = /^[0-9+\-() ]{6,30}$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const PARTY_CODE_RE = /^[A-Z0-9][A-Z0-9._/-]{1,39}$/;

export function emptyAddress(overrides = {}) {
  return {
    label: 'Office',
    purposes: [],
    line1: '',
    line2: '',
    landmark: '',
    area: '',
    city: '',
    district: '',
    state: '',
    country: DEFAULT_COUNTRY,
    pincode: '',
    placeId: '',
    isActive: true,
    notes: '',
    ...overrides,
  };
}

export function emptyContact(overrides = {}) {
  return {
    name: '',
    designation: '',
    department: '',
    phone: '',
    alternatePhone: '',
    email: '',
    preferredChannel: PREFERRED_CHANNELS.EMAIL,
    isPrimary: false,
    isDecisionMaker: false,
    receivesInvoices: false,
    receivesOrders: false,
    isActive: true,
    notes: '',
    ...overrides,
  };
}

export function defaultPartyForm(overrides = {}) {
  const defaults = {
    _id: null,
    version: undefined,
    code: '',
    name: '',
    legalName: '',
    partyType: PARTY_TYPES.BUSINESS,
    roles: [PARTY_ROLES.SUPPLIER],
    status: PARTY_STATUS.ACTIVE,
    lifecycleStage: PARTY_LIFECYCLE.ACTIVE,
    priority: PARTY_PRIORITY.NORMAL,
    accountOwner: null,
    leadSource: '',
    industry: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    communicationPreferences: {
      preferredChannel: PREFERRED_CHANNELS.EMAIL,
      doNotContact: false,
      marketingOptIn: false,
      whatsappOptIn: false,
    },
    tags: [],
    taxProfile: {
      isTaxRegistered: false,
      taxIdType: TAX_ID_TYPES.GSTIN,
      taxId: '',
      pan: '',
      gstRegistrationType: 'UNREGISTERED',
      registrationNumber: '',
      cin: '',
      msmeNumber: '',
      placeOfSupply: '',
    },
    addresses: {
      primaryAddress: emptyAddress({ purposes: ['registered'] }),
      additionalAddresses: [],
    },
    contacts: [],
    paymentTerms: {
      type: PAYMENT_TERM_TYPES.NET_DAYS,
      netDays: 30,
      note: '',
    },
    currency: DEFAULT_CURRENCY,
    creditLimit: '',
    bankAccounts: [],
    notes: '',
    meta: {},
    customFields: {},
  };
  return {
    ...defaults,
    ...overrides,
    communicationPreferences: {
      ...defaults.communicationPreferences,
      ...(overrides.communicationPreferences || {}),
    },
    taxProfile: { ...defaults.taxProfile, ...(overrides.taxProfile || {}) },
    addresses: {
      ...defaults.addresses,
      ...(overrides.addresses || {}),
    },
    paymentTerms: {
      ...defaults.paymentTerms,
      ...(overrides.paymentTerms || {}),
    },
  };
}

export function trimStr(value) {
  return value == null ? '' : String(value).trim();
}

function validateContact(contact, index, errors) {
  const email = trimStr(contact?.email);
  const phone = trimStr(contact?.phone);
  const alternatePhone = trimStr(contact?.alternatePhone);
  if (email && !EMAIL_RE.test(email)) {
    errors[`contacts.${index}.email`] = `Contact ${index + 1} has an invalid email`;
  }
  if (phone && !PHONE_RE.test(phone)) {
    errors[`contacts.${index}.phone`] = `Contact ${index + 1} has an invalid phone`;
  }
  if (alternatePhone && !PHONE_RE.test(alternatePhone)) {
    errors[`contacts.${index}.alternatePhone`] = `Contact ${index + 1} has an invalid alternate phone`;
  }
}

export function validatePartyForm(form) {
  const party = form || {};
  const errors = {};
  const name = trimStr(party.name);
  if (name.length < 2) errors.name = 'Name must contain at least 2 characters';
  if (name.length > 160) errors.name = 'Name cannot exceed 160 characters';

  const code = trimStr(party.code).toUpperCase();
  if (code && !PARTY_CODE_RE.test(code)) {
    errors.code = 'Code can use letters, numbers, dot, dash, slash, and underscore';
  }

  const roles = normalizePartyRoles(party.roles);
  if (!roles.length) {
    errors.roles = 'At least one role is required';
  } else {
    const invalid = roles.find(role => !isValidPartyRole(role));
    if (invalid) errors.roles = `Invalid role: ${invalid}`;
  }

  if (!isValidPartyStatus(party.status)) errors.status = 'Invalid status';
  if (!Object.values(PARTY_TYPES).includes(party.partyType)) {
    errors.partyType = 'Invalid partner type';
  }
  if (!Object.values(PARTY_LIFECYCLE).includes(party.lifecycleStage)) {
    errors.lifecycleStage = 'Invalid lifecycle stage';
  }
  if (!Object.values(PARTY_PRIORITY).includes(party.priority)) {
    errors.priority = 'Invalid priority';
  }

  const email = trimStr(party.email);
  if (email && !EMAIL_RE.test(email)) errors.email = 'Invalid email format';
  const phone = trimStr(party.phone);
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Invalid phone format';
  const alternatePhone = trimStr(party.alternatePhone);
  if (alternatePhone && !PHONE_RE.test(alternatePhone)) {
    errors.alternatePhone = 'Invalid alternate phone format';
  }

  const tax = party.taxProfile || {};
  const taxId = trimStr(tax.taxId).toUpperCase();
  const pan = trimStr(tax.pan).toUpperCase();
  if (tax.isTaxRegistered && !taxId) {
    errors['taxProfile.taxId'] = 'Tax ID is required for a registered partner';
  }
  if (taxId && tax.taxIdType === TAX_ID_TYPES.GSTIN && !GSTIN_RE.test(taxId)) {
    errors['taxProfile.taxId'] = 'Invalid GSTIN format';
  }
  if (pan && !PAN_RE.test(pan)) errors['taxProfile.pan'] = 'Invalid PAN format';

  (Array.isArray(party.contacts) ? party.contacts : [])
    .forEach((contact, index) => validateContact(contact, index, errors));

  const terms = party.paymentTerms || {};
  if (!Object.values(PAYMENT_TERM_TYPES).includes(terms.type)) {
    errors['paymentTerms.type'] = 'Invalid payment terms';
  }
  const netDays = Number(terms.netDays ?? 0);
  if (
    terms.type === PAYMENT_TERM_TYPES.NET_DAYS
    && (!Number.isInteger(netDays) || netDays < 0 || netDays > 3650)
  ) {
    errors['paymentTerms.netDays'] = 'Net days must be between 0 and 3650';
  }

  const creditLimit = party.creditLimit;
  if (creditLimit !== '' && creditLimit != null) {
    const amount = Number(creditLimit);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.creditLimit = 'Credit limit must be a non-negative number';
    }
  }
  if (!/^[A-Z]{3}$/.test(trimStr(party.currency).toUpperCase())) {
    errors.currency = 'Use a three-letter currency code';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    roles,
  };
}

export function ensureOnePrimaryContact(contacts = []) {
  let seen = false;
  return (Array.isArray(contacts) ? contacts : []).map(contact => {
    if (contact?.isPrimary && !seen) {
      seen = true;
      return { ...contact, isPrimary: true };
    }
    return { ...contact, isPrimary: false };
  });
}
