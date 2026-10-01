import { cn } from "@/utils/cn";

const IST_TIMEZONE = 'Asia/Kolkata';
const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: IST_TIMEZONE,
});
const TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: IST_TIMEZONE,
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

export function formatDateTimeParts(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <div>
      <p>{DATE_FORMATTER.format(date)}</p>
      <p className="mt-1 text-xs text-white-500">{TIME_FORMATTER.format(date).toUpperCase()}</p>
    </div>
  );
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
  let tempClass = '';
  let temperature = '';
  let density ='';
  let dimension = '';
  if (record?.temperature) {
    tempClass = record.temperature.value >= 1400 ? "text-red-400" : "text-blue-400";
    temperature = `${record.temperature.value} ${record.temperature.unit}`;
  }
  if (record?.density) density = `${record.density.value} ${record.density.unit}`;
  if (record?.dimension) {
     dimension = `${record.dimension.length} × ${record.dimension.width} × ${record.dimension.thickness} ${record.dimension.unit}`;
  }
  return (<div>
    <p className={cn(tempClass, "font-semibold")}>{temperature}</p>
    {density || dimension && <p>{density || '-'} · {dimension || '-'}</p>}
  </div>)
}
