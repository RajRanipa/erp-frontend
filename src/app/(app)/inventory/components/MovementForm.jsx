// frontend-erp/src/app/(app)/inventory/components/MovementForm.jsx
'use client';

import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import ItemSelect from './ItemSelect';
import WarehouseSelect from './WarehouseSelect';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import StockItemSelect from './StockItemSelect';
import Loading from '@/Components/Loading';
import SubmitButton from '@/Components/buttons/SubmitButton';

const ENDPOINT_BY_MODE = {
  RECEIPT: '/api/inventory/receipt',
  ISSUE: '/api/inventory/issue',
  ADJUST: '/api/inventory/adjust',
};

const MODE_TITLES = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  ADJUST: 'Adjust',
  REPACK: 'Packing Change',
};

function MovementForm({
  mode = 'RECEIPT',
  onSuccess,
  warehouses = [],
  defaultWarehouseId = '',
}) {
  const title = useMemo(() => MODE_TITLES[mode] || mode, [mode]);

  const [form, setForm] = useState({
    itemId: '',
    warehouseId: defaultWarehouseId,
    qty: '',
    uom: '',
    batchNo: '',
    bin: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isQtyValid = useMemo(() => {
    const n = Number(form.qty);
    if (!Number.isFinite(n)) return false;
    if (mode === 'ADJUST') return n !== 0;
    return n > 0;
  }, [form.qty, mode]);

  useEffect(() => {
    if (form.qty) setError(!isQtyValid);
  }, [isQtyValid, form.qty]);

  const isValid = useMemo(
    () => Boolean(form.itemId && form.warehouseId && form.uom && isQtyValid),
    [form.itemId, form.warehouseId, form.uom, isQtyValid]
  );

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w._id), label: w.name })),
    [warehouses]
  );

  const handleChange = useCallback((patch) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isValid) return;
      setLoading(true);
      try {
        const body = {
          itemId: form.itemId,
          warehouseId: form.warehouseId,
          qty: Number(form.qty),
          uom: form.uom.trim(),
          batchNo: form.batchNo?.trim() || null,
          bin: form.bin?.trim() || null,
          note: form.note?.trim() || '',
        };

        if (mode !== 'ADJUST') body.qty = Math.abs(body.qty);

        const url = ENDPOINT_BY_MODE[mode];
        const res = await axiosInstance.post(url, body);

        if (res?.data?.status) {
          Toast.success(`${title} posted`);
          setForm((f) => ({ ...f, qty: '', note: '' }));
          onSuccess?.(res.data);
        } else {
          const msg = res?.data?.message || `Failed to post ${title.toLowerCase()}`;
          Toast.error(msg);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          `Failed to post ${title.toLowerCase()}`;
        Toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [form.itemId, form.warehouseId, form.qty, form.uom, form.batchNo, form.bin, form.note, isValid, mode, onSuccess, title]
  );

  return (
    <div className="relative">
      <form onSubmit={submit} className={`rounded-lg p-3 space-y-3`}>
        <div className="flex flex-col justify-between">
          <h3 className="font-bold text-xl text-most-text mb-2">{title}</h3>

          <div className="grid md:grid-cols-2 gap-3 py-2">
            {mode === 'RECEIPT' ? (
              <ItemSelect
                value={form.itemId}
                onChange={(v) => handleChange({ itemId: v })}
                required
                label="Item"
              />
            ) : (
              <StockItemSelect
                value={form.itemId}
                onChange={(v) => handleChange({ itemId: v })}
                required
                label="Item"
              />
            )}

            <WarehouseSelect
              value={form.warehouseId}
              onChange={(v) => handleChange({ warehouseId: v })}
              required
              label="Warehouse"
              options={warehouseOptions}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3 py-2">
            <CustomInput
              label="Quantity"
              name="qty"
              type="number"
              step="any"
              value={form.qty}
              onChange={(e) => handleChange({ qty: e.target.value })}
              required
              placeholder={mode === 'ADJUST' ? '± Quantity' : 'Quantity > 0'}
              min={mode === 'ADJUST' ? undefined : 0.0001}
              err={error && 'Invalid quantity'}
            />
            <CustomInput
              label="UOM"
              name="uom"
              value={form.uom}
              onChange={(e) => handleChange({ uom: e.target.value })}
              required
              placeholder="pcs / kg / roll"
            />
            <CustomInput
              label="Batch"
              name="batchNo"
              value={form.batchNo}
              onChange={(e) => handleChange({ batchNo: e.target.value })}
              placeholder="optional"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3 py-2">
            <CustomInput
              label="Bin"
              value={form.bin}
              onChange={(e) => handleChange({ bin: e.target.value })}
              placeholder="optional"
            />
            <TextArea
              label="Note"
              value={form.note}
              onChange={(e) => handleChange({ note: e.target.value })}
              rows={2}
              placeholder={`Add a note for this ${title.toLowerCase()} (optional)`}
            />
          </div>

          <div className="flex gap-3">
            <SubmitButton loading={loading} label="Submit" />
          </div>
        </div>
      </form>
    </div>
  );
}

export default memo(MovementForm);