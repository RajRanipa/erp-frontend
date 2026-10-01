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
  if (!record) return '—';

  // Support both nested object format and flat properties if your API varies
  const tempVal = record?.temperature?.value ?? record?.temperatureValue;
  const tempUnit = record?.temperature?.unit ?? '°C';

  const densityVal = record?.density?.value ?? record?.densityValue;
  const densityUnit = record?.density?.unit ?? 'kg/m³';

  let temperature = '';
  let tempClass = '';
  if (tempVal != null && tempVal !== '') {
    tempClass = Number(tempVal) >= 1400 ? 'text-red-400' : 'text-blue-400';
    temperature = `${tempVal} ${tempUnit}`;
  }

  let density = '';
  if (densityVal != null && densityVal !== '') {
    density = `${densityVal} ${densityUnit}`;
  }

  let dimension = '';
  if (record?.dimension) {
    const { length, width, thickness, unit = 'mm' } = record.dimension;
    if (length || width || thickness) {
      dimension = `${length || '-'} × ${width || '-'} × ${thickness || '-'} ${unit}`;
    }
  } else if (record?.sizeCode) {
    dimension = record.sizeCode;
  }

  // If nothing is available, show a dash
  if (!temperature && !density && !dimension) {
    return <span>—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {temperature ? (
        <p className={cn(tempClass, 'font-semibold')}>{temperature}</p>
      ) : null}

      {(density || dimension) ? (
        <p className="text-xs text-white-700">
          {[density, dimension].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}