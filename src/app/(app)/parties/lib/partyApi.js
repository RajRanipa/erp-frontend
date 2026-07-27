// src/app/(app)/parties/lib/partyApi.js
import { apiClient, axiosInstance } from "@/lib/axiosInstance";

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v);
    if (!s) return;
    sp.set(k, s);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function apiListParties(
  {
    role = '',
    status = 'active',
    lifecycleStage = '',
    priority = '',
    q = '',
    page = 1,
    limit = 25,
    sortBy = 'name',
    sortOrder = 'asc',
  } = {},
  { signal } = {}
) {
  const qs = buildQuery({
    role,
    status,
    lifecycleStage,
    priority,
    q,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  return apiClient.get(`/api/parties${qs}`, { signal });
}

export async function apiPartySummary({ signal } = {}) {
  return apiClient.get('/api/parties/summary', { signal });
}

export async function apiCheckPartyDuplicates(payload, { signal } = {}) {
  return apiClient.post('/api/parties/check-duplicates', payload, { signal });
}

export async function apiPartyOptions({ role = '', q = '', limit = 30 } = {}, { signal } = {}) {
  const qs = buildQuery({ role, q, limit });
  return apiClient.get(`/api/parties/options${qs}`, { signal });
}

export async function apiPartyAccountOwners({ q = '' } = {}, { signal } = {}) {
  const qs = buildQuery({ q });
  return apiClient.get(`/api/parties/account-owners${qs}`, { signal });
}

export async function apiGetParty(id, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  return apiClient.get(`/api/parties/${encodeURIComponent(id)}`, { signal });
}

export async function apiCreateParty(payload, { signal } = {}) {
  return apiClient.post('/api/parties', payload, { signal });
}

export async function apiUpdateParty(id, payload, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  return apiClient.patch(`/api/parties/${encodeURIComponent(id)}`, payload, { signal });
}

export async function apiUpdatePartyStatus(id, to, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  return apiClient.patch(`/api/parties/${encodeURIComponent(id)}/status`, { to }, { signal });
}

export async function apiDeleteParty(id, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  return apiClient.delete(`/api/parties/${encodeURIComponent(id)}`, { signal });
}

export async function apiRestoreParty(id, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  return apiClient.post(
    `/api/parties/${encodeURIComponent(id)}/restore`,
    {},
    { signal },
  );
}

export async function apiExportPartiesXlsx(
  {
    role = '',
    status = 'all',
    lifecycleStage = '',
    priority = '',
    q = '',
  } = {},
  { signal } = {},
) {
  const qs = buildQuery({ role, status, lifecycleStage, priority, q });
  const res = await axiosInstance.get(`/api/parties/export/xlsx${qs}`,
    {
      responseType: 'blob',
      signal,
    }
  );
  return res.data;
}

export async function apiImportPartiesXlsx(file, { signal } = {}) {
  if (!file) throw new Error('Missing file');

  const fd = new FormData();
  fd.append('file', file);

  return apiClient.post('/api/parties/import/xlsx', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });
}

export function downloadBlob(blob, filename = `business_partners_${Date.now()}.xlsx`) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
