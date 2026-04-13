// src/app/(app)/parties/lib/partyApi.js
// Party API client (axiosInstance)
// - Uses your existing axiosInstance which already has baseURL, withCredentials cookies,
//   refresh handling, and centralized error handling.

import { axiosInstance } from "@/lib/axiosInstance";

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

// -----------------------------
// Public API (matches backend routes, via Next proxy prefix /api)
// NOTE: your example uses `/api/parties`, so we keep that.
// -----------------------------

// GET /api/parties
export async function apiListParties(
  { role = '', status = 'active', q = '', page = 1, limit = 50 } = {},
  { signal } = {}
) {
  const qs = buildQuery({ role, status, q, page, limit });
  const res = await axiosInstance.get(`/api/parties${qs}`, { signal });
  return res.data;
}

// GET /api/parties/options
export async function apiPartyOptions({ role = '', q = '', limit = 30 } = {}, { signal } = {}) {
  const qs = buildQuery({ role, q, limit });
  const res = await axiosInstance.get(`/api/parties/options${qs}`, { signal });
  return res.data;
}

// GET /api/parties/:id
export async function apiGetParty(id, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  const res = await axiosInstance.get(`/api/parties/${encodeURIComponent(id)}`, { signal });
  return res.data;
}

// POST /api/parties
export async function apiCreateParty(payload, { signal } = {}) {
  const res = await axiosInstance.post('/api/parties', payload, { signal });
  return res.data;
}

// PATCH /api/parties/:id
export async function apiUpdateParty(id, payload, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  const res = await axiosInstance.patch(`/api/parties/${encodeURIComponent(id)}`, payload, { signal });
  return res.data;
}

// PATCH /api/parties/:id/status  body: { to }
export async function apiUpdatePartyStatus(id, to, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  const res = await axiosInstance.patch(`/api/parties/${encodeURIComponent(id)}/status`, { to }, { signal });
  return res.data;
}

// DELETE /api/parties/:id
export async function apiDeleteParty(id, { signal } = {}) {
  if (!id) throw new Error('Missing party id');
  const res = await axiosInstance.delete(`/api/parties/${encodeURIComponent(id)}`, { signal });
  return res.data;
}

// GET /api/parties/export/xlsx (blob)
export async function apiExportPartiesXlsx({ role = '', status = 'all', q = '' } = {}, { signal } = {}) {
  const qs = buildQuery({ role, status, q });
  const res = await axiosInstance.get(`/api/parties/export/xlsx${qs}`,
    {
      responseType: 'blob',
      signal,
    }
  );
  // axios returns Blob in res.data
  return res.data;
}

// POST /api/parties/import/xlsx (multipart)
export async function apiImportPartiesXlsx(file, { signal } = {}) {
  if (!file) throw new Error('Missing file');

  const fd = new FormData();
  fd.append('file', file);

  const res = await axiosInstance.post('/api/parties/import/xlsx', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });

  return res.data;
}

// Helper: download a blob as a file (call from UI)
export function downloadBlob(blob, filename = `parties_${Date.now()}.xlsx`) {
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
