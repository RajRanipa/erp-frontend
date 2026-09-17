'use client';

import { axiosInstance } from '@/lib/axiosInstance';

// Compatibility guard for databases that have not completed item cleanup yet.
// The backend migration removes this field permanently; the frontend must
// neither display it nor send it back while old cached records still contain it.
const REMOVED_ATTRIBUTE_CODES = new Set(['material_class']);
const supportedAttributes = attributes =>
  (attributes || []).filter(attribute => !REMOVED_ATTRIBUTE_CODES.has(attribute.code));
const sanitizeItem = item => item && typeof item === 'object'
  ? { ...item, attributes: supportedAttributes(item.attributes) }
  : item;
const sanitizeSetup = setup => setup && typeof setup === 'object'
  ? {
      ...setup,
      attributes: supportedAttributes(setup.attributes),
    }
  : setup;
const sanitizeForm = form => form && typeof form === 'object'
  ? { ...form, attributes: supportedAttributes(form.attributes) }
  : form;
const sanitizePayload = payload => ({
  ...payload,
  attributes: Object.fromEntries(
    Object.entries(payload?.attributes || {})
      .filter(([code]) => !REMOVED_ATTRIBUTE_CODES.has(code)),
  ),
});
const sanitizeEditContext = context => context && typeof context === 'object'
  ? {
      ...context,
      item: sanitizeItem(context.item),
      setup: sanitizeSetup(context.setup),
      form: sanitizeForm(context.form),
    }
  : context;

export const itemMasterApi = {
  setup: async () =>
    sanitizeSetup((await axiosInstance.get('/api/item-master/setup')).data),
  form: async familyId =>
    sanitizeForm(
      (await axiosInstance.get(`/api/item-master/families/${familyId}/form`)).data,
    ),
  list: async params => {
    const response = await axiosInstance.get('/api/item-master/items', { params });
    return { ...response, data: (response.data || []).map(sanitizeItem) };
  },
  get: async id =>
    sanitizeItem((await axiosInstance.get(`/api/item-master/items/${id}`)).data),
  editContext: async id =>
    sanitizeEditContext(
      (await axiosInstance.get(`/api/item-master/items/${id}/edit-context`)).data,
    ),
  options: async params =>
    (await axiosInstance.get('/api/item-master/items/options', { params })).data,
  create: async payload =>
    axiosInstance.post('/api/item-master/items', sanitizePayload(payload)),
  update: async (id, payload) =>
    axiosInstance.put(`/api/item-master/items/${id}`, sanitizePayload(payload)),
  transition: async (id, to, reason = '') =>
    axiosInstance.patch(`/api/item-master/items/${id}/status`, { to, reason }),
  deletionAssessment: async id =>
    (await axiosInstance.get(`/api/item-master/items/${id}/deletion-assessment`)).data,
  delete: async (id, confirmation) =>
    axiosInstance.delete(`/api/item-master/items/${id}`, {
      data: { confirmation },
    }),
};

export function apiMessage(response, fallback) {
  return response?.api?.message || response?.data?.message || fallback;
}

export function apiErrorMessage(error, fallback) {
  return error?.response?.api?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;
}
