'use client';

import { useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import StockItemSelect from './StockItemSelect';
import WarehouseSelect from './WarehouseSelect';

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `transfer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const initialForm = () => ({
  stockBucketId: '',
  itemId: '',
  fromWarehouseId: '',
  toWarehouseId: '',
  qty: '',
  uom: '',
  batchNo: '',
  fromBin: '',
  toBin: '',
  toBatchNo: '',
  note: '',
  requestId: newRequestId(),
});

export default function TransferForm({ onSuccess, warehouses = [] }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const quantity = Number(form.qty);
  const sameLocation = form.fromWarehouseId === form.toWarehouseId &&
    (form.fromBin || '') === (form.toBin || '') &&
    (form.batchNo || '') === (form.toBatchNo || form.batchNo || '');
  const valid = Boolean(
    form.itemId &&
    form.fromWarehouseId &&
    form.toWarehouseId &&
    form.uom &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    !sameLocation,
  );

  const warehouseOptions = useMemo(
    () => warehouses.map(warehouse => ({
      value: String(warehouse._id),
      label: warehouse.name,
    })),
    [warehouses],
  );

  const change = patch => setForm(current => ({ ...current, ...patch }));

  const selectSource = (itemId, item, snapshot) => {
    change({
      stockBucketId: snapshot?._id ? String(snapshot._id) : '',
      itemId: itemId || '',
      fromWarehouseId: snapshot?.warehouseId?._id || snapshot?.warehouseId || '',
      uom: snapshot?.uom || item?.UOM || '',
      batchNo: snapshot?.batchNo || '',
      fromBin: snapshot?.bin || '',
      toBatchNo: snapshot?.batchNo || '',
    });
  };

  const submit = async event => {
    event.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/inventory/transfer', {
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        qty: quantity,
        uom: form.uom,
        batchNo: form.batchNo.trim() || null,
        toBatchNo: form.toBatchNo.trim() || null,
        fromBin: form.fromBin.trim() || null,
        toBin: form.toBin.trim() || null,
        note: form.note.trim(),
        requestId: form.requestId,
      });
      if (!response?.data?.status) {
        throw new Error(response?.data?.message || 'Failed to transfer stock');
      }
      Toast.success(response.data.message || 'Stock transferred');
      setForm(initialForm());
      onSuccess?.(response.data);
    } catch (error) {
      Toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to transfer stock',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-bold text-lg text-most-text">Transfer stock</h2>
        <button type="submit" disabled={!valid || loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>

      <StockItemSelect
        value={form.stockBucketId}
        onChange={selectSource}
        required
        label="Source stock bucket"
      />

      <div className="grid md:grid-cols-2 gap-3 py-2">
        <WarehouseSelect
          label="From warehouse"
          value={form.fromWarehouseId}
          options={warehouseOptions}
          disabled
          required
        />
        <WarehouseSelect
          label="To warehouse"
          value={form.toWarehouseId}
          onChange={value => change({ toWarehouseId: value })}
          options={warehouseOptions}
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3 py-2">
        <CustomInput
          label="Quantity"
          type="number"
          step="any"
          value={form.qty}
          onChange={event => change({ qty: event.target.value })}
          required
          err={form.qty && !(quantity > 0) ? 'Quantity must be greater than zero' : ''}
        />
        <CustomInput label="UOM" value={form.uom} readOnly required />
        <CustomInput label="Source batch" value={form.batchNo} readOnly />
      </div>

      <div className="grid md:grid-cols-3 gap-3 py-2">
        <CustomInput label="Source bin" value={form.fromBin} readOnly />
        <CustomInput
          label="Destination batch"
          value={form.toBatchNo}
          onChange={event => change({ toBatchNo: event.target.value })}
          placeholder="Defaults to source batch"
        />
        <CustomInput
          label="Destination bin"
          value={form.toBin}
          onChange={event => change({ toBin: event.target.value })}
          placeholder="Optional"
        />
      </div>

      {sameLocation && form.itemId && (
        <p className="text-sm text-error">
          Destination warehouse, bin, or batch must differ from the source.
        </p>
      )}

      <TextArea
        label="Note"
        value={form.note}
        onChange={event => change({ note: event.target.value })}
        rows={2}
        placeholder="Transfer reason or reference (optional)"
      />
    </form>
  );
}
