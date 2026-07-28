const STYLES = {
  DRAFT: 'bg-slate-500/15 text-slate-500 ring-slate-500/30',
  PENDING_APPROVAL: 'bg-amber-500/15 text-amber-500 ring-amber-500/30',
  APPROVED: 'bg-blue-500/15 text-blue-500 ring-blue-500/30',
  PARTIALLY_RECEIVED: 'bg-violet-500/15 text-violet-500 ring-violet-500/30',
  RECEIVED: 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30',
  POSTED: 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30',
  VERIFIED: 'bg-cyan-500/15 text-cyan-500 ring-cyan-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30',
  REJECTED: 'bg-red-500/15 text-red-500 ring-red-500/30',
  CANCELLED: 'bg-red-500/15 text-red-500 ring-red-500/30',
  CLOSED: 'bg-neutral-500/15 text-neutral-500 ring-neutral-500/30',
  MATCHED: 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30',
  VARIANCE: 'bg-orange-500/15 text-orange-500 ring-orange-500/30',
  NOT_CHECKED: 'bg-slate-500/15 text-slate-500 ring-slate-500/30',
};

export default function ProcurementStatusBadge({ value }) {
  const normalized = String(value || 'UNKNOWN').toUpperCase();
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        STYLES[normalized] || STYLES.DRAFT
      }`}
    >
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}
