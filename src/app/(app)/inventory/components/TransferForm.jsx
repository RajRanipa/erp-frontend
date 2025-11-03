// frontend-erp/src/app/(app)/inventory/components/TransferForm.jsx
// frontend-erp/src/app/(app)/inventory/components/TransferForm.jsx
'use client';

import { useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import ItemSelect from './ItemSelect';
import WarehouseSelect from './WarehouseSelect';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';

export default function TransferForm({ onSuccess }) {
  const [form, setForm] = useState({
    itemId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    qty: '',
    uom: '',
    batchNo: '',
    bin: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const isQtyValid = useMemo(() => {
    const n = Number(form.qty);
    return Number.isFinite(n) && n > 0;
  }, [form.qty]);

  const sameWarehouse = form.fromWarehouseId && form.fromWarehouseId === form.toWarehouseId;

  const isValid = Boolean(
    form.itemId &&
    form.fromWarehouseId &&
    form.toWarehouseId &&
    !sameWarehouse &&
    form.uom &&
    isQtyValid
  );

  const handleChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      if (sameWarehouse) Toast.warning('From and To warehouse must be different');
      return;
    }
    setLoading(true);
    try {
      const body = {
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        qty: Math.abs(Number(form.qty)),
        uom: form.uom.trim(),
        batchNo: form.batchNo?.trim() || null,
        bin: form.bin?.trim() || null,
        note: form.note?.trim() || '',
      };

      const res = await axiosInstance.post('/inventory/transfer', body);

      if (res?.data?.status) {
        Toast.success('Transfer posted');
        setForm((f) => ({ ...f, qty: '', note: '' }));
        onSuccess?.(res.data);
      } else {
        const msg = res?.data?.message || 'Failed to transfer';
        Toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to transfer';
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className=" rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-bold text-lg text-most-text">Transfer</h2>
        <button
          type="submit"
          disabled={!isValid || loading}
          className={`btn-primary  ${!isValid || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'
            }`}
        >
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>

      <ItemSelect
        value={form.itemId}
        onChange={(v) => handleChange({ itemId: v })}
        required
        label='Item'
      />

      <div className="grid md:grid-cols-2 gap-3 py-2">
        <WarehouseSelect
          label="From Warehouse"
          value={form.fromWarehouseId}
          onChange={(v) => handleChange({ fromWarehouseId: v })}
          required
        />
        <WarehouseSelect
          label="To Warehouse"
          value={form.toWarehouseId}
          onChange={(v) => handleChange({ toWarehouseId: v })}
          required
        />
      </div>
      {sameWarehouse && (
        <p className="text-xs text-red-500 mb-1">
          From and To warehouse cannot be the same.
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-3 py-2">
        <CustomInput
          label="Quantity"
          type="number"
          step="any"
          value={form.qty}
          onChange={(e) => handleChange({ qty: e.target.value })}
          required
          placeholder="quantity > 0"
        />
        <CustomInput
          label="UOM"
          value={form.uom}
          onChange={(e) => handleChange({ uom: e.target.value })}
          required
          placeholder="pcs / kg / roll"
        />
        <CustomInput
          label="Batch"
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
          placeholder="Add a note for this transfer (optional)"
        />
      </div>


    </form>
  );
}