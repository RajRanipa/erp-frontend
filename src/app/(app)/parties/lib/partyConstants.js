export const PARTY_ROLES = Object.freeze({
  SUPPLIER: 'SUPPLIER',
  CUSTOMER: 'CUSTOMER',
  TRANSPORTER: 'TRANSPORTER',
  JOBWORKER: 'JOBWORKER',
  BROKER: 'BROKER',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  OTHER: 'OTHER',
});

export const PARTY_ROLE_OPTIONS = [
  { value: PARTY_ROLES.SUPPLIER, label: 'Supplier' },
  { value: PARTY_ROLES.CUSTOMER, label: 'Customer' },
  { value: PARTY_ROLES.TRANSPORTER, label: 'Transporter' },
  { value: PARTY_ROLES.JOBWORKER, label: 'Job Worker' },
  { value: PARTY_ROLES.BROKER, label: 'Broker / Agent' },
  { value: PARTY_ROLES.SERVICE_PROVIDER, label: 'Service Provider' },
  { value: PARTY_ROLES.OTHER, label: 'Other' },
];

export const PARTY_TYPES = Object.freeze({
  BUSINESS: 'BUSINESS',
  INDIVIDUAL: 'INDIVIDUAL',
});

export const PARTY_TYPE_OPTIONS = [
  { value: PARTY_TYPES.BUSINESS, label: 'Business / Organization' },
  { value: PARTY_TYPES.INDIVIDUAL, label: 'Individual' },
];

export const PARTY_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  ARCHIVED: 'archived',
});

export const PARTY_STATUS_OPTIONS = [
  { value: PARTY_STATUS.ACTIVE, label: 'Active' },
  { value: PARTY_STATUS.INACTIVE, label: 'Inactive' },
  { value: PARTY_STATUS.BLOCKED, label: 'Blocked' },
];

export const PARTY_FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...PARTY_STATUS_OPTIONS,
  { value: PARTY_STATUS.ARCHIVED, label: 'Archived' },
];

export const PARTY_LIFECYCLE = Object.freeze({
  PROSPECT: 'PROSPECT',
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  LOST: 'LOST',
});

export const PARTY_LIFECYCLE_OPTIONS = [
  { value: PARTY_LIFECYCLE.PROSPECT, label: 'Prospect' },
  { value: PARTY_LIFECYCLE.ONBOARDING, label: 'Onboarding' },
  { value: PARTY_LIFECYCLE.ACTIVE, label: 'Active Relationship' },
  { value: PARTY_LIFECYCLE.DORMANT, label: 'Dormant' },
  { value: PARTY_LIFECYCLE.LOST, label: 'Lost' },
];

export const PARTY_PRIORITY = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  STRATEGIC: 'STRATEGIC',
});

export const PARTY_PRIORITY_OPTIONS = [
  { value: PARTY_PRIORITY.LOW, label: 'Low' },
  { value: PARTY_PRIORITY.NORMAL, label: 'Normal' },
  { value: PARTY_PRIORITY.HIGH, label: 'High' },
  { value: PARTY_PRIORITY.STRATEGIC, label: 'Strategic' },
];

export const PREFERRED_CHANNELS = Object.freeze({
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  NONE: 'NONE',
});

export const PREFERRED_CHANNEL_OPTIONS = [
  { value: PREFERRED_CHANNELS.EMAIL, label: 'Email' },
  { value: PREFERRED_CHANNELS.PHONE, label: 'Phone' },
  { value: PREFERRED_CHANNELS.WHATSAPP, label: 'WhatsApp' },
  { value: PREFERRED_CHANNELS.SMS, label: 'SMS' },
  { value: PREFERRED_CHANNELS.NONE, label: 'No preference' },
];

export const TAX_REGISTERED_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export const TAX_ID_TYPES = Object.freeze({
  GSTIN: 'GSTIN',
  VAT: 'VAT',
  EIN: 'EIN',
  OTHER: 'OTHER',
});

export const TAX_ID_TYPE_OPTIONS = [
  { value: TAX_ID_TYPES.GSTIN, label: 'GSTIN' },
  { value: TAX_ID_TYPES.VAT, label: 'VAT Number' },
  { value: TAX_ID_TYPES.EIN, label: 'EIN' },
  { value: TAX_ID_TYPES.OTHER, label: 'Other Tax ID' },
];

export const GST_REGISTRATION_TYPE_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'SEZ', label: 'SEZ' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'OVERSEAS', label: 'Overseas' },
  { value: 'OTHER', label: 'Other' },
];

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

export const DEFAULT_COUNTRY = 'India';
export const DEFAULT_CURRENCY = 'INR';

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

export function normalizePartyRoles(input = []) {
  const values = Array.isArray(input) ? input : [];
  return [...new Set(values.map(value => String(value).trim().toUpperCase()).filter(Boolean))];
}

export function isValidPartyStatus(status) {
  return Object.values(PARTY_STATUS).includes(status);
}

export function isValidPartyRole(role) {
  return Object.values(PARTY_ROLES).includes(role);
}
