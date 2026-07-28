import { apiClient } from '@/lib/axiosInstance';

export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const procurementApi = {
  summary: options => apiClient.get('/api/procurement/summary', options),
  lookup: (type, params = {}, options = {}) =>
    apiClient.get(`/api/procurement/lookups/${type}${buildQuery(params)}`, options),

  listOrders: (params = {}, options = {}) =>
    apiClient.get(`/api/procurement/orders${buildQuery(params)}`, options),
  getOrder: (id, options = {}) =>
    apiClient.get(`/api/procurement/orders/${encodeURIComponent(id)}`, options),
  createOrder: (payload, options = {}) =>
    apiClient.post('/api/procurement/orders', payload, options),
  updateOrder: (id, payload, options = {}) =>
    apiClient.patch(`/api/procurement/orders/${encodeURIComponent(id)}`, payload, options),
  orderAction: (id, action, note = '', options = {}) =>
    apiClient.post(
      `/api/procurement/orders/${encodeURIComponent(id)}/${action}`,
      { note },
      options,
    ),

  listReceipts: (params = {}, options = {}) =>
    apiClient.get(`/api/procurement/receipts${buildQuery(params)}`, options),
  getReceipt: (id, options = {}) =>
    apiClient.get(`/api/procurement/receipts/${encodeURIComponent(id)}`, options),
  createReceipt: (payload, options = {}) =>
    apiClient.post('/api/procurement/receipts', payload, options),
  updateReceipt: (id, payload, options = {}) =>
    apiClient.patch(`/api/procurement/receipts/${encodeURIComponent(id)}`, payload, options),
  receiptAction: (id, action, note = '', options = {}) =>
    apiClient.post(
      `/api/procurement/receipts/${encodeURIComponent(id)}/${action}`,
      { note },
      options,
    ),
  resolveReceiptInspection: (id, payload, options = {}) =>
    apiClient.post(
      `/api/procurement/receipts/${encodeURIComponent(id)}/resolve-inspection`,
      payload,
      options,
    ),

  listReturns: (params = {}, options = {}) =>
    apiClient.get(`/api/procurement/returns${buildQuery(params)}`, options),
  getReturn: (id, options = {}) =>
    apiClient.get(`/api/procurement/returns/${encodeURIComponent(id)}`, options),
  createReturn: (payload, options = {}) =>
    apiClient.post('/api/procurement/returns', payload, options),
  updateReturn: (id, payload, options = {}) =>
    apiClient.patch(`/api/procurement/returns/${encodeURIComponent(id)}`, payload, options),
  returnAction: (id, action, note = '', options = {}) =>
    apiClient.post(
      `/api/procurement/returns/${encodeURIComponent(id)}/${action}`,
      { note },
      options,
    ),

  listInvoices: (params = {}, options = {}) =>
    apiClient.get(`/api/procurement/invoices${buildQuery(params)}`, options),
  getInvoice: (id, options = {}) =>
    apiClient.get(`/api/procurement/invoices/${encodeURIComponent(id)}`, options),
  createInvoice: (payload, options = {}) =>
    apiClient.post('/api/procurement/invoices', payload, options),
  updateInvoice: (id, payload, options = {}) =>
    apiClient.patch(`/api/procurement/invoices/${encodeURIComponent(id)}`, payload, options),
  invoiceAction: (id, action, note = '', options = {}) =>
    apiClient.post(
      `/api/procurement/invoices/${encodeURIComponent(id)}/${action}`,
      { note },
      options,
    ),
};

export const money = (value, currency = 'INR') => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const shortDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
};

export const supplierName = document =>
  document?.supplierId?.legalName
  || document?.supplierId?.name
  || document?.supplierSnapshot?.name
  || 'Unknown supplier';

export const warehouseName = document =>
  document?.warehouseId?.name || document?.warehouseId?.code || '—';
