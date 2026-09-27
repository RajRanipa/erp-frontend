const IST_TIMEZONE = 'Asia/Kolkata';
const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: IST_TIMEZONE,
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit',
  minute: '2-digit', hour12: true, timeZone: IST_TIMEZONE,
});
const INDIA_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: IST_TIMEZONE,
});

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(date);
}

export function formatWeight(value, digits = 2) {
  return `${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} kg`;
}

export function todayInIndia() {
  const parts = INDIA_DATE_PARTS_FORMATTER.formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function specificationText(record) {
  const parts = [];
  if (record?.temperature) parts.push(`${record.temperature.value} ${record.temperature.unit}`);
  if (record?.density) parts.push(`${record.density.value} ${record.density.unit}`);
  if (record?.dimension) {
    parts.push(`${record.dimension.length} × ${record.dimension.width} × ${record.dimension.thickness} ${record.dimension.unit}`);
  }
  return parts.join(' · ') || 'Specification not mapped';
}
