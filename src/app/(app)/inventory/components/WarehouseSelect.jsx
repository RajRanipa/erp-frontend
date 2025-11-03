// // frontend-erp/src/app/(app)/inventory/components/WarehouseSelect.jsx
// frontend-erp/src/app/(app)/inventory/components/WarehouseSelect.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import SelectInput from '@/Components/inputs/SelectInput';
import { Toast } from '@/Components/toast';

/**
 * WarehouseSelect
 *
 * Props:
 * - value: string | null (warehouseId)
 * - onChange: (warehouseId: string | null) => void
 * - label?: string (default: "Warehouse")
 * - placeholder?: string (default: "Select warehouse")
 * - required?: boolean
 * - disabled?: boolean
 * - autoFocus?: boolean
 * - onlyActive?: boolean (default: true)
 */
export default function WarehouseSelect({
  value,
  onChange,
  label = '',
  placeholder = 'Select warehouse',
  required = false,
  disabled = false,
  autoFocus = false,
  onlyActive = true,
}) {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (onlyActive) params.set('isActive', 'true');

        // Adjust the endpoint if your API differs:
        // e.g., GET /warehouses?isActive=true
        const res = await axiosInstance.get(`/api/warehouses?${params.toString()}`);
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.warehouses)
          ? res.data.warehouses
          : Array.isArray(res?.data)
          ? res.data
          : [];

        setWarehouses(list);
      } catch (err) {
        Toast.error('Failed to load warehouses');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  const options = useMemo(() => {
    return (warehouses || []).map((w) => ({
      value: w._id || w.id,
      label: w.name || w.code || 'Unnamed Warehouse',
    }));
  }, [warehouses]);

  const selected = useMemo(() => {
    if (!value) return null;
    return options.find((o) => o.value === value) || null;
  }, [value, options]);

  const handleChange = (opt) => {
    if (!opt) return onChange?.(null);
    if (typeof opt === 'string') return onChange?.(opt);
    return onChange?.(opt.value);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[240px]">
      {!loading && <SelectInput
        name={label}
        label={label}
        required={required}
        value={selected || value || ''}
        onChange={e => handleChange(e.target.value)}
        options={options}
        placeholder={placeholder}
        disabled={disabled || loading}
        autoFocus={autoFocus}
      />}
    </div>
  );
}