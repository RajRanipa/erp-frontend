import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  PARTY_LIFECYCLE,
  PARTY_PRIORITY,
  PARTY_STATUS,
  PARTY_TYPES,
  PAYMENT_TERM_TYPES,
  PREFERRED_CHANNELS,
  TAX_ID_TYPES,
  normalizePartyRoles,
} from './partyConstants';
import {
  emptyAddress,
  emptyContact,
  ensureOnePrimaryContact,
  trimStr,
} from './partySchema';

function idValue(value) {
  if (!value) return null;
  return typeof value === 'object' ? value._id || value.id || null : value;
}

function normalizeAddress(address = {}) {
  return {
    ...(address._id ? { _id: address._id } : {}),
    ...emptyAddress(),
    ...address,
    purposes: [...new Set(
      (Array.isArray(address.purposes) ? address.purposes : [])
        .map(value => String(value).trim().toLowerCase())
        .filter(Boolean),
    )],
    country: trimStr(address.country) || DEFAULT_COUNTRY,
    isActive: address.isActive !== false,
  };
}

export function normalizeAddresses(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      primaryAddress: normalizeAddress(value.primaryAddress || {}),
      additionalAddresses: (
        Array.isArray(value.additionalAddresses) ? value.additionalAddresses : []
      ).map(normalizeAddress),
    };
  }

  if (Array.isArray(value)) {
    const [primary = {}, ...additional] = value;
    return {
      primaryAddress: normalizeAddress({
        ...primary,
        purposes: [
          ...(primary.purposes || []),
          ...(primary.isDefaultBilling ? ['billing'] : []),
          ...(primary.isDefaultShipping ? ['shipping'] : []),
        ],
      }),
      additionalAddresses: additional.map(address => normalizeAddress({
        ...address,
        purposes: [
          ...(address.purposes || []),
          ...(address.isDefaultBilling ? ['billing'] : []),
          ...(address.isDefaultShipping ? ['shipping'] : []),
        ],
      })),
    };
  }
  return {
    primaryAddress: emptyAddress({ purposes: ['registered'] }),
    additionalAddresses: [],
  };
}

function normalizeContact(contact = {}) {
  return {
    ...(contact._id ? { _id: contact._id } : {}),
    ...emptyContact(),
    ...contact,
    email: trimStr(contact.email).toLowerCase(),
    isActive: contact.isActive !== false,
  };
}

function normalizeBankAccount(account = {}) {
  return {
    ...(account._id ? { _id: account._id } : {}),
    accountHolderName: trimStr(account.accountHolderName),
    bankName: trimStr(account.bankName),
    accountNumber: trimStr(account.accountNumber),
    ifscCode: trimStr(account.ifscCode).toUpperCase(),
    swiftCode: trimStr(account.swiftCode).toUpperCase(),
    branch: trimStr(account.branch),
    accountType: account.accountType || 'CURRENT',
    currency: trimStr(account.currency || DEFAULT_CURRENCY).toUpperCase(),
    isPrimary: Boolean(account.isPrimary),
    isActive: account.isActive !== false,
    verifiedAt: account.verifiedAt || null,
  };
}

export function apiPartyToForm(party = {}) {
  const roles = normalizePartyRoles(party.roles);
  return {
    _id: party._id || null,
    version: party.__v,
    code: trimStr(party.code),
    name: trimStr(party.name),
    legalName: trimStr(party.legalName),
    partyType: party.partyType || PARTY_TYPES.BUSINESS,
    roles: roles.length ? roles : ['SUPPLIER'],
    status: party.status === PARTY_STATUS.ARCHIVED
      ? PARTY_STATUS.INACTIVE
      : party.status || PARTY_STATUS.ACTIVE,
    lifecycleStage: party.lifecycleStage || PARTY_LIFECYCLE.ACTIVE,
    priority: party.priority || PARTY_PRIORITY.NORMAL,
    accountOwner: idValue(party.accountOwner),
    leadSource: trimStr(party.leadSource),
    industry: trimStr(party.industry),
    phone: trimStr(party.phone),
    alternatePhone: trimStr(party.alternatePhone),
    email: trimStr(party.email),
    website: trimStr(party.website),
    communicationPreferences: {
      preferredChannel:
        party.communicationPreferences?.preferredChannel || PREFERRED_CHANNELS.EMAIL,
      doNotContact: Boolean(party.communicationPreferences?.doNotContact),
      marketingOptIn: Boolean(party.communicationPreferences?.marketingOptIn),
      whatsappOptIn: Boolean(party.communicationPreferences?.whatsappOptIn),
    },
    tags: Array.isArray(party.tags) ? party.tags : [],
    taxProfile: {
      isTaxRegistered: Boolean(party.taxProfile?.isTaxRegistered),
      taxIdType: party.taxProfile?.taxIdType || TAX_ID_TYPES.GSTIN,
      taxId: trimStr(party.taxProfile?.taxId),
      pan: trimStr(party.taxProfile?.pan),
      gstRegistrationType: party.taxProfile?.gstRegistrationType || 'UNREGISTERED',
      registrationNumber: trimStr(party.taxProfile?.registrationNumber),
      cin: trimStr(party.taxProfile?.cin),
      msmeNumber: trimStr(party.taxProfile?.msmeNumber),
      placeOfSupply: trimStr(party.taxProfile?.placeOfSupply),
    },
    addresses: normalizeAddresses(party.addresses),
    contacts: ensureOnePrimaryContact(
      (Array.isArray(party.contacts) ? party.contacts : []).map(normalizeContact),
    ),
    paymentTerms: {
      type: party.paymentTerms?.type || PAYMENT_TERM_TYPES.NET_DAYS,
      netDays: Number.isFinite(Number(party.paymentTerms?.netDays))
        ? Number(party.paymentTerms.netDays)
        : 30,
      note: trimStr(party.paymentTerms?.note),
    },
    currency: trimStr(party.currency || DEFAULT_CURRENCY).toUpperCase(),
    creditLimit: party.creditLimit == null ? '' : Number(party.creditLimit),
    bankAccounts: (Array.isArray(party.bankAccounts) ? party.bankAccounts : [])
      .map(normalizeBankAccount),
    notes: trimStr(party.notes),
    meta: party.meta || {},
    customFields: party.customFields || {},
  };
}

export function formToApiPartyPayload(form = {}) {
  const roles = normalizePartyRoles(form.roles);
  return {
    ...(form.version !== undefined ? { version: form.version } : {}),
    code: trimStr(form.code).toUpperCase(),
    name: trimStr(form.name),
    legalName: trimStr(form.legalName),
    partyType: form.partyType || PARTY_TYPES.BUSINESS,
    roles: roles.length ? roles : ['SUPPLIER'],
    status: form.status || PARTY_STATUS.ACTIVE,
    lifecycleStage: form.lifecycleStage || PARTY_LIFECYCLE.ACTIVE,
    priority: form.priority || PARTY_PRIORITY.NORMAL,
    accountOwner: idValue(form.accountOwner),
    leadSource: trimStr(form.leadSource),
    industry: trimStr(form.industry),
    phone: trimStr(form.phone),
    alternatePhone: trimStr(form.alternatePhone),
    email: trimStr(form.email).toLowerCase(),
    website: trimStr(form.website),
    communicationPreferences: {
      preferredChannel:
        form.communicationPreferences?.preferredChannel || PREFERRED_CHANNELS.EMAIL,
      doNotContact: Boolean(form.communicationPreferences?.doNotContact),
      marketingOptIn: Boolean(form.communicationPreferences?.marketingOptIn),
      whatsappOptIn: Boolean(form.communicationPreferences?.whatsappOptIn),
    },
    tags: (Array.isArray(form.tags) ? form.tags : [])
      .map(value => trimStr(value).toLowerCase())
      .filter(Boolean),
    taxProfile: {
      isTaxRegistered: Boolean(form.taxProfile?.isTaxRegistered),
      taxIdType: form.taxProfile?.taxIdType || TAX_ID_TYPES.GSTIN,
      taxId: trimStr(form.taxProfile?.taxId).toUpperCase(),
      pan: trimStr(form.taxProfile?.pan).toUpperCase(),
      gstRegistrationType:
        form.taxProfile?.gstRegistrationType
        || (form.taxProfile?.isTaxRegistered ? 'REGULAR' : 'UNREGISTERED'),
      registrationNumber: trimStr(form.taxProfile?.registrationNumber),
      cin: trimStr(form.taxProfile?.cin).toUpperCase(),
      msmeNumber: trimStr(form.taxProfile?.msmeNumber).toUpperCase(),
      placeOfSupply: trimStr(form.taxProfile?.placeOfSupply),
    },
    addresses: normalizeAddresses(form.addresses),
    contacts: ensureOnePrimaryContact(
      (Array.isArray(form.contacts) ? form.contacts : []).map(normalizeContact),
    ),
    paymentTerms: {
      type: form.paymentTerms?.type || PAYMENT_TERM_TYPES.NET_DAYS,
      netDays: Number(form.paymentTerms?.netDays ?? 0),
      note: trimStr(form.paymentTerms?.note),
    },
    currency: trimStr(form.currency || DEFAULT_CURRENCY).toUpperCase(),
    creditLimit: form.creditLimit === '' ? 0 : Number(form.creditLimit || 0),
    bankAccounts: (Array.isArray(form.bankAccounts) ? form.bankAccounts : [])
      .map(normalizeBankAccount),
    notes: trimStr(form.notes),
    meta: form.meta || {},
    customFields: form.customFields || {},
  };
}

export function partyToOption(party = {}) {
  return {
    value: party.value || party._id,
    label: party.label || `${party.code ? `${party.code} · ` : ''}${party.name || 'Unnamed'}`,
    raw: party,
  };
}
