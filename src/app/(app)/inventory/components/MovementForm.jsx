'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react';
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

  // track if user has interacted with qty to avoid showing validation too early
  const qtyTouched = useRef(false);
  const lastFetchedItemId = useRef(null);

  // reusable qty validator that depends on mode
  const validateQty = useCallback((raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return false;
    if (mode === 'ADJUST') return n !== 0; // can be positive or negative, but not zero
    return n > 0; // receipt/issue must be strictly positive
  }, [mode]);

  const initialForm = useMemo(() => ({
    itemId: '',
    warehouseId: defaultWarehouseId,
    qty: '',
    uom: '',
    batchNo: '',
    bin: '',
    note: '',
  }), [defaultWarehouseId]);

  const [form, setForm] = useState(initialForm);
  const [formVersion, setFormVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setForm(f => ({ ...f, warehouseId: defaultWarehouseId }));
  }, [defaultWarehouseId]);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    qtyTouched.current = false;
    setError(false);
    setFormVersion(v => v + 1);
  }, [initialForm]);

  const isQtyValid = validateQty(form.qty);

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

  const handleQtyChange = useCallback((e) => {
    const raw = e.target.value;
    qtyTouched.current = true;
    setForm((f) => ({ ...f, qty: raw }));
    // validate only on qty change
    setError(!validateQty(raw));
  }, [validateQty]);

  // Auto-fill UOM when item changes (editable by user afterwards)
  useEffect(() => {
    const currentItemId = form.itemId?.trim?.() || '';
    // If item cleared, also clear UOM and reset tracker
    // console.log('currentItemId', currentItemId);
    if (!currentItemId) {
      if (lastFetchedItemId.current !== null) {
        setForm(f => ({ ...f, uom: '' }));
        lastFetchedItemId.current = null;
      }
      return;
    }

    // Only fetch if the item actually changed
    if (currentItemId === lastFetchedItemId.current) return;
    lastFetchedItemId.current = currentItemId;

    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/items/uom/${currentItemId}`);
        // Try common shapes: {data:{uom}}, {data:{UOM}}, {uom}, {UOM}
        const payload = res?.data || {};
        const dataNode = payload?.data || payload;
        const fetchedUom =
          dataNode?.uom ??
          dataNode?.UOM ??
          payload?.uom ??
          payload?.UOM ??
          '';

        if (!cancelled) {
          // Set the fetched UOM, but keep the field editable
          setForm(f => ({ ...f, uom: fetchedUom || f.uom || '' }));
        }
      } catch (e) {
        // Silently ignore fetch errors; user can still type UOM manually
      }
    })();

    return () => { cancelled = true; };
  }, [form.itemId, axiosInstance]);

  const submit = useCallback(
    async (e) => {
      // console.log('form 0', form);
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
          // console.log('res.data', res.data);
          Toast.success(`${title} posted`);
          resetForm();
          // (Optional) blur to avoid any lingering native hints on focused input
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
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
    [form, isValid, mode, onSuccess, title, resetForm]
  );

  return (
    <div className="relative">
      <form key={formVersion} onSubmit={submit} noValidate className={`rounded-lg p-3 space-y-3`}>
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
              onChange={handleQtyChange}
              required
              placeholder={mode === 'ADJUST' ? '± Quantity' : 'Quantity > 0'}
              // min={mode === 'ADJUST' ? undefined : 0.0001}
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
              className="h-[38px]"
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