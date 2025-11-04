'use client';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Step6Modules — choose which ERP modules to enable initially.
 *
 * Props:
 * - values: full company object (expects values.enabledModules)
 * - saving: boolean (disable inputs/buttons while saving)
 * - onSave: (partialPayload) => Promise
 * - onNext: () => void
 * - onBack: () => void (optional)
 * - onValidityChange: (boolean) => void
 * - onDirtyChange: (boolean) => void
 */
export default function Step6Modules({ values = {}, saving, onValidityChange, onDirtyChange, onPartialChange }) {
  // Canonical module list (label/value), memoized
  const MODULE_OPTIONS = useMemo(() => ([
    { value: 'items',        label: 'Items / Product Master' },
    { value: 'inventory',    label: 'Inventory Management' },
    { value: 'procurement',  label: 'Procurement / Purchase' },
    { value: 'sales',        label: 'Sales & Order Management' },
    { value: 'production',   label: 'Production / Manufacturing' },
    { value: 'bom',          label: 'Bill of Materials (BOM)' },
    { value: 'mrp',          label: 'Material Requirement Planning (MRP)' },
    { value: 'qa_qc',        label: 'Quality Control / Quality Assurance' },
    { value: 'wms',          label: 'Warehouse Management System (WMS)' },
    { value: 'scm',          label: 'Supply Chain Management (SCM)' },
    { value: 'logistics',    label: 'Logistics & Dispatch' },
    { value: 'maintenance',  label: 'Maintenance / Asset Management' },
  ]), []);

  // Reasonable defaults for a manufacturing ERP
  const DEFAULTS = useMemo(() => (
    ['items', 'inventory', 'procurement', 'sales', 'production', 'bom']
  ), []);

  const [initialized, setInitialized] = useState(false);
  const [selected, setSelected] = useState(new Set(DEFAULTS));

  // Hydrate from server values when available
  useEffect(() => {
    const incoming = Array.isArray(values?.enabledModules) ? values.enabledModules : [];
    const normalized = incoming.map(String).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (normalized.length) {
      setSelected(new Set(normalized));
    } else {
      // keep defaults on first load if server has none
      setSelected(prev => prev instanceof Set ? prev : new Set(DEFAULTS));
    }
    setInitialized(true);
  }, [values]);

  useEffect(() => {
    const current = Array.isArray(values?.enabledModules) ? values.enabledModules : [];
    const currentNorm = current.map(String).map(s => s.trim().toLowerCase()).filter(Boolean);

    const selArr = Array.from(selected);
    const valid = selArr.length > 0;
    onValidityChange?.(valid);

    const dirty = !sameSet(selArr, currentNorm);
    onDirtyChange?.(dirty);

    onPartialChange?.({
      enabledModules: selArr,
      setupProgress: { modules: valid },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, values]);

  const toggle = (value) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  };

  const selectCore = () => setSelected(new Set(DEFAULTS));
  const selectAll  = () => setSelected(new Set(MODULE_OPTIONS.map(m => m.value)));
  const clearAll   = () => setSelected(new Set());

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const x of b) if (!sa.has(x)) return false;
    return true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 py-1">
        <button
          type="button"
          onClick={selectCore}
          disabled={saving}
          className="btn-border text-sm disabled:opacity-50"
          autoFocus
        >
          Core Defaults
        </button>
        <button
          type="button"
          onClick={selectAll}
          disabled={saving}
          className="btn-border text-sm disabled:opacity-50"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={saving}
          className="btn-border text-sm disabled:opacity-50"
        >
          Clear All
        </button>
      </div>

      {initialized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          {MODULE_OPTIONS.map(m => (
            <label key={m.value} className={`text-most-text flex items-center gap-3 border rounded p-3 cursor-pointer ${selected.has(m.value)  ? ' border-green-400 bg-white-100/50' : 'bg-white-200 border-white-100'}`}>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.has(m.value)}
                onChange={() => toggle(m.value)}
                disabled={saving}
              />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}