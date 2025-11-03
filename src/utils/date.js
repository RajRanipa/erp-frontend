// src/utils/date.js
// create helper function which conver date to dd/mm/yyyy format

export function formatDateDMY(input, time = false) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';

  // Convert UTC → local time
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);

  const dd = String(local.getDate()).padStart(2, '0');
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const yyyy = local.getFullYear();

  if (time) {
    const hh = String(local.getHours()).padStart(2, '0');
    const min = String(local.getMinutes()).padStart(2, '0');
    const ss = String(local.getSeconds()).padStart(2, '0');
    return <span className="flex flex-col">{`${dd}/${mm}/${yyyy}`} <span className="text-sm text-white-400">{`${hh}:${min}:${ss}`}</span></span>;
  }

  return `${dd}/${mm}/${yyyy}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}