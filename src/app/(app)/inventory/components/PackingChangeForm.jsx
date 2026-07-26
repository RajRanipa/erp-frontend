'use client';

import { useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import ItemSelect from './ItemSelect';
import StockItemSelect from './StockItemSelect';
import WarehouseSelect from './WarehouseSelect';

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `repack-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const initialForm = () => ({
  stockBucketId: '',
  fromItemId: '',
  toItemId: '',
  warehouseId: '',
  qty: '',
  uom: '',
  batchNo: '',
  bin: '',
  note: '',
  requestId: newRequestId(),
});

const objectId = value => value?._id || value || '';

export default function PackingChangeForm({ onSuccess, warehouses = [] }) {
  const [form, setForm] = useState(initialForm);
  const [sourceItem, setSourceItem] = useState(null);
  const [targetItem, setTargetItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const quantity = Number(form.qty);
  const sameItem = form.fromItemId && form.fromItemId === form.toItemId;

  const targetParams = useMemo(() => {
    if (!sourceItem) return { categoryKey: 'FG', status: 'active' };
    return {
      categoryKey: 'FG',
      status: 'active',
      productType: objectId(sourceItem.productType),
      temperature: objectId(sourceItem.temperature),
      density: objectId(sourceItem.density),
      dimension: objectId(sourceItem.dimension),
    };
  }, [sourceItem]);

  const warehouseOptions = useMemo(
    () => warehouses.map(warehouse => ({
      value: String(warehouse._id),
      label: warehouse.name,
    })),
    [warehouses],
  );

  const valid = Boolean(
    form.fromItemId &&
    form.toItemId &&
    form.warehouseId &&
    form.uom &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    !sameItem,
  );

  const change = patch => setForm(current => ({ ...current, ...patch }));

  const selectSource = (itemId, item, snapshot) => {
    setSourceItem(item || null);
    setTargetItem(null);
    change({
      stockBucketId: snapshot?._id ? String(snapshot._id) : '',
      fromItemId: itemId || '',
      toItemId: '',
      warehouseId: snapshot?.warehouseId?._id || snapshot?.warehouseId || '',
      uom: snapshot?.uom || item?.UOM || '',
      batchNo: snapshot?.batchNo || '',
      bin: snapshot?.bin || '',
    });
  };

  const submit = async event => {
    event.preventDefault();
    if (!valid || loading) return;
    if (objectId(sourceItem?.productType) !== objectId(targetItem?.productType)) {
      Toast.error('Source and target must use the same Product Type');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/inventory/repack', {
        fromItemId: form.fromItemId,
        toItemId: form.toItemId,
        warehouseId: form.warehouseId,
        qty: quantity,
        uom: form.uom,
        batchNo: form.batchNo.trim() || null,
        bin: form.bin.trim() || null,
        note: form.note.trim(),
        requestId: form.requestId,
      });
      if (!response?.data?.status) {
        throw new Error(response?.data?.message || 'Failed to change packing');
      }
      Toast.success(response.data.message || 'Packing changed');
      setForm(initialForm());
      setSourceItem(null);
      setTargetItem(null);
      onSuccess?.(response.data);
    } catch (error) {
      Toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to change packing',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-bold text-lg text-most-text">Finished-goods packing change</h2>
        <button type="submit" disabled={!valid || loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3 py-2">
        <StockItemSelect
          label="Source stock bucket"
          value={form.stockBucketId}
          onChange={selectSource}
          apiparams={{ categoryKey: 'FG' }}
          required
        />
        <ItemSelect
          label="Target packing Item"
          value={form.toItemId}
          onChange={(itemId, item) => {
            setTargetItem(item || null);
            change({ toItemId: itemId || '' });
          }}
          apiparams={targetParams}
          disabled={!sourceItem}
          required
        />
      </div>

      {sameItem && <p className="text-sm text-error">Source and target Items must differ.</p>}

      <div className="grid md:grid-cols-3 gap-3 py-2">
        <WarehouseSelect
          label="Warehouse"
          value={form.warehouseId}
          options={warehouseOptions}
          disabled
          required
        />
        <CustomInput label="UOM" value={form.uom} readOnly required />
        <CustomInput
          label="Quantity"
          type="number"
          step="any"
          value={form.qty}
          onChange={event => change({ qty: event.target.value })}
          required
          err={form.qty && !(quantity > 0) ? 'Quantity must be greater than zero' : ''}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3 py-2">
        <CustomInput label="Batch" value={form.batchNo} readOnly />
        <CustomInput label="Bin" value={form.bin} readOnly />
      </div>

      <TextArea
        label="Note"
        value={form.note}
        onChange={event => change({ note: event.target.value })}
        rows={2}
        placeholder="Packing-change reason or reference (optional)"
      />
    </form>
  );
}
