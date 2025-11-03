// src/utils/date.js
// create helper function which conver date to dd/mm/yyyy format

export function formatDateDMY(input) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);
  const dd = String(local.getDate()).padStart(2, '0');
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const yyyy = local.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
