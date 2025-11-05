// frontend-erp/src/app/(app)/inventory/components/WarehouseSelect.jsx
'use client';

import { useMemo } from 'react';
import SelectInput from '@/Components/inputs/SelectInput';

/**
 * WarehouseSelect (controlled, dumb)
 *
 * Props:
 * - value: string | null (warehouseId)
 * - onChange: (warehouseId: string | null) => void
 * - label?: string (default: "Warehouse")
 * - placeholder?: string (default: "Select warehouse")
 * - required?: boolean
 * - disabled?: boolean
 * - autoFocus?: boolean
 * - options: Array<{ value: string, label: string }>
 */
export default function WarehouseSelect({
  value,
  onChange,
  label = 'Warehouse',
  placeholder = 'Select warehouse',
  required = false,
  disabled = false,
  autoFocus = false,
  options = [],
}) {
  // Normalize options (defensive)
  const normalized = useMemo(() => {
    return (options || []).map((o) => ({
      value: String(o?.value ?? ''),
      label: o?.label ?? 'Unnamed Warehouse',
    }));
  }, [options]);

  // Compute current value for SelectInput
  const current = useMemo(() => {
    if (!value) return '';
    const v = String(value);
    const found = normalized.find((o) => String(o.value) === v);
    return found ? found.value : v; // keep value so native select can show it
  }, [value, normalized]);

  const handleChange = (e) => {
    const v = e?.target?.value;
    if (v === undefined || v === null || v === '') return onChange?.(null);
    onChange?.(String(v));
  };

  return (
    <div className="flex flex-col gap-1 min-w-[240px] relative">
      <SelectInput
        name={label}
        label={label}
        required={required}
        value={current}
        onChange={handleChange}
        options={normalized}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
}