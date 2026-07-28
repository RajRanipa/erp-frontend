'use client';

import Loading from '@/Components/Loading';

export const inputClass =
  'w-full rounded-lg border border-color-100 bg-most px-3 py-2 text-sm text-most-text outline-none transition focus:border-action focus:ring-2 focus:ring-action/20 disabled:cursor-not-allowed disabled:opacity-60';

export function MetricCard({ label, value, detail, tone = 'blue', loading = false }) {
  const tones = {
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
    violet: 'from-violet-500/20 to-violet-500/5 text-violet-500',
    red: 'from-red-500/20 to-red-500/5 text-red-500',
  };
  return (
    <div className={`rounded-xl border border-color-100 bg-gradient-to-br p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary-text/65">
        {label}
      </p>
      {loading ? (
        <Loading variant="skeleton" className="mt-3" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-most-text">{value ?? 0}</p>
      )}
      {detail && <p className="mt-1 text-xs text-secondary-text/60">{detail}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-action/10 text-xl">
        🛒
      </div>
      <h3 className="font-medium text-most-text">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-secondary-text/65">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ columns = 6, rows = 6 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, column) => (
            <Loading key={column} variant="skeleton" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold text-most-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-secondary-text/65">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, required, error, children, hint }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="font-medium text-secondary-text">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-red-500">{error}</span>
      ) : hint ? (
        <span className="text-xs text-secondary-text/55">{hint}</span>
      ) : null}
    </label>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="font-medium underline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
