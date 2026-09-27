const STATUS_STYLES = {
  RUNNING: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  PLANNED: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  COMPLETED: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
};

export default function CampaignStatusBadge({ status }) {
  const value = String(status || 'UNKNOWN').toUpperCase();
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_STYLES[value] || 'border-white-200 bg-white-100 text-secondary-text'}`}>
      {value}
    </span>
  );
}
