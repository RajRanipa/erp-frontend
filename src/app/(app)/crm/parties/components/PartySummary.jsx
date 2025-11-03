// src/app/crm/parties/components/PartySummary.jsx
export default function PartySummary({ p }) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-most">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-h2 font-semibold">{p.displayName || p.legalName}</div>
          <div className="text-secondaryText capitalize">{p.role} • {p.status}</div>
        </div>
        <div className="text-sm">
          <div>GSTIN: {p.tax?.gstin || '-'}</div>
          <div>Email: {p.email || '-'}</div>
          <div>Phone: {p.phone || '-'}</div>
        </div>
      </div>
    </div>
  );
}