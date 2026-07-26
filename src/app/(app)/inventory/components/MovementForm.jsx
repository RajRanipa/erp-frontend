'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import SubmitButton from '@/Components/buttons/SubmitButton';
import ItemSelect from './ItemSelect';
import StockItemSelect from './StockItemSelect';
import WarehouseSelect from './WarehouseSelect';

const ENDPOINT_BY_MODE = {
  RECEIPT: '/api/inventory/receipt',
  ISSUE: '/api/inventory/issue',
  ADJUST: '/api/inventory/adjust',
  RESERVE: '/api/inventory/reserve',
  RELEASE: '/api/inventory/release',
};

const MODE_TITLES = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  ADJUST: 'Adjustment',
  RESERVE: 'Reservation',
  RELEASE: 'Reservation Release',
};

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `inventory-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyForm = defaultWarehouseId => ({
  stockBucketId: '',
  itemId: '',
  warehouseId: defaultWarehouseId || '',
  qty: '',
  uom: '',
  batchNo: '',
  bin: '',
  note: '',
  requestId: newRequestId(),
});

function MovementForm({
  mode = 'RECEIPT',
  onSuccess,
  warehouses = [],
  defaultWarehouseId = '',
}) {
  const [form, setForm] = useState(() => emptyForm(defaultWarehouseId));
  const [loading, setLoading] = useState(false);
  const title = MODE_TITLES[mode] || mode;
  const usesExistingBucket = mode !== 'RECEIPT';
  const qty = Number(form.qty);
  const qtyValid = Number.isFinite(qty) && (mode === 'ADJUST' ? qty !== 0 : qty > 0);
  const isValid = Boolean(
    form.itemId && form.warehouseId && form.uom && qtyValid,
  );

  const warehouseOptions = useMemo(
    () => warehouses.map(warehouse => ({
      value: String(warehouse._id),
      label: warehouse.name,
    })),
    [warehouses],
  );

  const change = useCallback(patch => {
    setForm(current => ({ ...current, ...patch }));
  }, []);

  const handleReceiptItem = useCallback((itemId, item) => {
    change({
      itemId: itemId || '',
      uom: item?.UOM || '',
    });
  }, [change]);

  const handleStockBucket = useCallback((itemId, item, snapshot) => {
    change({
      stockBucketId: snapshot?._id ? String(snapshot._id) : '',
      itemId: itemId || '',
      warehouseId: snapshot?.warehouseId?._id || snapshot?.warehouseId || '',
      uom: snapshot?.uom || item?.UOM || '',
      batchNo: snapshot?.batchNo || '',
      bin: snapshot?.bin || '',
    });
  }, [change]);

  const reset = useCallback(() => {
    setForm(emptyForm(defaultWarehouseId));
  }, [defaultWarehouseId]);

  const submit = useCallback(async event => {
    event.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      const body = {
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        qty: mode === 'ADJUST' ? qty : Math.abs(qty),
        uom: form.uom,
        batchNo: form.batchNo.trim() || null,
        bin: form.bin.trim() || null,
        note: form.note.trim(),
        requestId: form.requestId,
      };
      const response = await axiosInstance.post(ENDPOINT_BY_MODE[mode], body);
      if (!response?.data?.status) {
        throw new Error(response?.data?.message || `Failed to post ${title.toLowerCase()}`);
      }

      Toast.success(response.data.message || `${title} posted`);
      reset();
      onSuccess?.(response.data);
    } catch (error) {
      Toast.error(
        error?.response?.data?.message ||
        error?.message ||
        `Failed to post ${title.toLowerCase()}`,
      );
    } finally {
      setLoading(false);
    }
  }, [form, isValid, loading, mode, onSuccess, qty, reset, title]);

  return (
    <form onSubmit={submit} noValidate className="rounded-lg p-3 space-y-3">
      <h3 className="font-bold text-xl text-most-text">{title}</h3>

      <div className="grid md:grid-cols-2 gap-3 py-2 items-center">
        {usesExistingBucket ? (
          <StockItemSelect
            value={form.stockBucketId}
            onChange={handleStockBucket}
            required
            label="Stock bucket"
            reservedOnly={mode === 'RELEASE'}
            positiveOnly={!['RELEASE', 'ADJUST'].includes(mode)}
            activeItemsOnly={mode !== 'RELEASE'}
          />
        ) : (
          <ItemSelect
            value={form.itemId}
            onChange={handleReceiptItem}
            required
            label="Item"
          />
        )}

        <WarehouseSelect
          value={form.warehouseId}
          onChange={value => change({ warehouseId: value })}
          required
          label="Warehouse"
          options={warehouseOptions}
          disabled={usesExistingBucket}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3 py-2">
        <CustomInput
          label="Quantity"
          name="qty"
          type="number"
          step="any"
          value={form.qty}
          onChange={event => change({ qty: event.target.value })}
          required
          placeholder={mode === 'ADJUST' ? 'Positive or negative quantity' : 'Quantity greater than zero'}
          err={form.qty && !qtyValid ? 'Enter a valid non-zero quantity' : ''}
        />
        <CustomInput
          label="UOM"
          name="uom"
          value={form.uom}
          required
          readOnly
          info="Set by the selected Item"
        />
        <CustomInput
          label="Batch"
          name="batchNo"
          value={form.batchNo}
          onChange={event => change({ batchNo: event.target.value })}
          placeholder="Optional"
          readOnly={usesExistingBucket}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3 py-2">
        <CustomInput
          label="Bin"
          name="bin"
          value={form.bin}
          onChange={event => change({ bin: event.target.value })}
          placeholder="Optional"
          readOnly={usesExistingBucket}
        />
        <TextArea
          label="Note"
          value={form.note}
          onChange={event => change({ note: event.target.value })}
          rows={2}
          placeholder={`Reason or reference for this ${title.toLowerCase()} (optional)`}
          className="h-[38px]"
        />
      </div>

      <SubmitButton loading={loading} label="Submit" disabled={!isValid} />
    </form>
  );
}

export default memo(MovementForm);
