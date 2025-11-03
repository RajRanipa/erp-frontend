// frontend-erp/src/app/(app)/inventory/components/MovementForm.jsx
'use client';

import { useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import ItemSelect from './ItemSelect';
// If you already have this component, keep the import. Otherwise create later.
import WarehouseSelect from './WarehouseSelect';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import StockItemSelect from './StockItemSelect';

const ENDPOINT_BY_MODE = {
  RECEIPT: '/api/inventory/receipt',
  ISSUE: '/api/inventory/issue',
  ADJUST: '/api/inventory/adjust',
};

const MODE_TITLES = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  ADJUST: 'Adjust',
  REPACK: 'Packing Change',   // ← new
};

export default function MovementForm({ mode = 'RECEIPT', onSuccess }) {
  const title = MODE_TITLES[mode] || mode;

  const [form, setForm] = useState({
    itemId: '',
    warehouseId: '',
    qty: '',
    uom: '',
    batchNo: '',
    bin: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const isQtyValid = useMemo(() => {
    const n = Number(form.qty);
    if (!Number.isFinite(n)) return false;
    if (mode === 'ADJUST') return n !== 0;
    return n > 0;
  }, [form.qty, mode]);

  const isValid = Boolean(form.itemId && form.warehouseId && form.uom && isQtyValid);

  const handleChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
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

      // For ADJUST we allow negative or positive quantity entered as-is.
      // For RECEIPT/ISSUE backend service will convert sign as needed, but we send positive numbers.
      if (mode !== 'ADJUST') body.qty = Math.abs(body.qty);

      const url = ENDPOINT_BY_MODE[mode];
      const res = await axiosInstance.post(url, body);

      if (res?.data?.status) {
        Toast.success(`${title} posted`);
        setForm((f) => ({ ...f, qty: '', note: '' })); // keep selections, clear inputs
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
  };

  return (
    <form onSubmit={submit} className=" rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-bold text-lg text-most-text">{title}</h2>
        <button
          type="submit"
          disabled={!isValid || loading}
          className={`btn-primary ${
            !isValid || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'
          }`}
        >
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3 py-2">
        {mode === 'RECEIPT' ? (<ItemSelect
          value={form.itemId}
          onChange={(v) => handleChange({ itemId: v })}
          required
          label='Item'
        />):
        (<StockItemSelect
          value={form.itemId}
          onChange={(v) => handleChange({ itemId: v })}
          required
          label='Item'
        />)}
        <WarehouseSelect
          value={form.warehouseId}
          onChange={(v) => handleChange({ warehouseId: v })}
          required
          label='Warehouse'
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3 py-2">
        <CustomInput
          label="Quantity"
          type="number"
          step="any"
          value={form.qty}
          onChange={(e) => handleChange({ qty: e.target.value })}
          required
          placeholder={mode === 'ADJUST' ? '± quantity' : 'quantity > 0'}
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
          placeholder={`Add a note for this ${title.toLowerCase()} (optional)`}
        />
      </div>
    </form>
  );
}