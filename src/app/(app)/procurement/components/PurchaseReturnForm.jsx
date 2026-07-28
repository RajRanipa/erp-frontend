'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import { ErrorBanner, Field, PageTitle, inputClass } from './ProcurementUI';
import { procurementApi, shortDate, supplierName, warehouseName } from '../lib/procurementApi';

const today = () => new Date().toISOString().slice(0, 10);

const buildLines = (receipt, purchaseReturn = null) => {
  const returnByReceiptLine = new Map(
    (purchaseReturn?.lines || []).map(line => [String(line.goodsReceiptLineId), line]),
  );
  return (receipt?.lines || [])
  .map(line => ({
    goodsReceiptLineId: line._id,
    itemName: line.itemName,
    uom: line.uom,
    batchNo: line.batchNo || '',
    bin: line.bin || '',
    available: Math.max(0, Number(line.acceptedQty || 0) - Number(line.returnedQty || 0)),
    qty: returnByReceiptLine.get(String(line._id))?.qty || 0,
    reason: returnByReceiptLine.get(String(line._id))?.reason || 'QUALITY_REJECTION',
    remarks: returnByReceiptLine.get(String(line._id))?.remarks || '',
  }))
  .filter(line => line.available > 0);
};

export default function PurchaseReturnForm({ returnId = null }) {
  const router = useRouter();
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    goodsReceiptId: '',
    returnDate: today(),
    supplierCreditNoteNo: '',
    notes: '',
    lines: [],
  });

  const selectReceipt = useCallback(async (receiptId, signal) => {
    if (!receiptId) {
      setSelectedReceipt(null);
      setForm(current => ({ ...current, goodsReceiptId: '', lines: [] }));
      return;
    }
    const result = await procurementApi.getReceipt(receiptId, { signal });
    setSelectedReceipt(result.data);
    setForm(current => ({
      ...current,
      goodsReceiptId: receiptId,
      lines: buildLines(result.data),
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await procurementApi.listReceipts(
          { status: 'POSTED', limit: 100 },
          { signal: controller.signal },
        );
        const existing = returnId
          ? await procurementApi.getReturn(returnId, { signal: controller.signal })
          : null;
        const existingReturn = existing?.data;
        const existingReceiptId = existingReturn
          ? String(existingReturn.goodsReceiptId?._id || existingReturn.goodsReceiptId)
          : null;
        const existingReceipt = existingReceiptId
          ? await procurementApi.getReceipt(existingReceiptId, { signal: controller.signal })
          : null;
        const receiptMap = new Map(
          (result.data || []).map(receipt => [String(receipt._id), receipt]),
        );
        if (existingReceipt?.data) {
          receiptMap.set(String(existingReceipt.data._id), existingReceipt.data);
        }
        setReceipts([...receiptMap.values()]);
        if (existingReturn && existingReceipt?.data) {
          setSelectedReceipt(existingReceipt.data);
          setForm({
            goodsReceiptId: existingReceiptId,
            returnDate: existingReturn.returnDate?.slice(0, 10) || today(),
            supplierCreditNoteNo: existingReturn.supplierCreditNoteNo || '',
            notes: existingReturn.notes || '',
            lines: buildLines(existingReceipt.data, existingReturn),
          });
        } else {
          const requested = new URLSearchParams(window.location.search).get('goodsReceiptId');
          if (requested) await selectReceipt(requested, controller.signal);
        }
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, 'Unable to load posted goods receipts.'));
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [returnId, selectReceipt]);

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateLine = (id, field, value) => setForm(current => ({
    ...current,
    lines: current.lines.map(line => (
      line.goodsReceiptLineId === id ? { ...line, [field]: value } : line
    )),
  }));
  const total = useMemo(
    () => form.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    [form.lines],
  );

  const save = async postAfterSave => {
    if (!form.goodsReceiptId) return setError('Select a posted goods receipt.');
    const activeLines = form.lines.filter(line => Number(line.qty) > 0);
    if (!activeLines.length) return setError('Enter a return quantity on at least one line.');
    const exceeds = activeLines.find(line => Number(line.qty) > line.available);
    if (exceeds) return setError(`${exceeds.itemName} exceeds the returnable quantity.`);
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        lines: activeLines.map(({ itemName, uom, batchNo, bin, available, ...line }) => line),
      };
      const created = returnId
        ? await procurementApi.updateReturn(returnId, payload)
        : await procurementApi.createReturn(payload);
      if (postAfterSave) {
        await procurementApi.returnAction(created.data._id, 'post');
        Toast.success(`${created.data.returnNumber} posted and stock reversed`);
      } else {
        Toast.success(`${created.data.returnNumber} saved as draft`);
      }
      router.push(`/procurement/returns/${created.data._id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save the purchase return.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Supplier return"
        title={returnId ? 'Edit purchase return' : 'Create purchase return'}
        description="The stock issue uses the original receipt warehouse, item, batch, bin, and UOM."
      />
      <ErrorBanner message={error} />

      <section className="grid gap-4 rounded-xl border border-color-100 bg-secondary p-4 lg:grid-cols-4">
        <Field label="Posted goods receipt" required>
          <select
            className={inputClass}
            value={form.goodsReceiptId}
            disabled={loading || Boolean(returnId)}
            onChange={async event => {
              setLoading(true);
              try {
                await selectReceipt(event.target.value);
              } catch (requestError) {
                setError(getApiErrorMessage(requestError, 'Unable to load goods receipt.'));
              } finally {
                setLoading(false);
              }
            }}
          >
            <option value="">Select GRN</option>
            {receipts.map(receipt => (
              <option key={receipt._id} value={receipt._id}>
                {receipt.grnNumber} · {supplierName(receipt)} · {shortDate(receipt.receivedAt)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Return date" required>
          <input type="date" className={inputClass} value={form.returnDate} onChange={event => updateField('returnDate', event.target.value)} />
        </Field>
        <Field label="Supplier credit note">
          <input className={inputClass} value={form.supplierCreditNoteNo} onChange={event => updateField('supplierCreditNoteNo', event.target.value)} />
        </Field>
        <div className="rounded-lg bg-primary p-3 text-sm">
          <p className="text-xs uppercase text-primary-text/55">Return from</p>
          <p className="mt-1 font-medium">{selectedReceipt ? warehouseName(selectedReceipt) : '—'}</p>
          <p className="text-xs text-primary-text/55">{selectedReceipt ? supplierName(selectedReceipt) : ''}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        <div className="flex items-center justify-between border-b border-color-100 px-4 py-3">
          <div>
            <h2 className="font-medium">Return lines</h2>
            <p className="text-xs text-secondary-text/55">Only quantities originally accepted by this GRN are eligible.</p>
          </div>
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-500">Return: {total}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-primary text-xs uppercase text-primary-text/65">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Return qty</th>
                <th className="px-4 py-3">Batch / bin</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-100">
              {form.lines.length ? form.lines.map(line => (
                <tr key={line.goodsReceiptLineId}>
                  <td className="px-4 py-3 font-medium">{line.itemName}</td>
                  <td className="px-4 py-3">{line.available} {line.uom}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={line.available}
                      step="any"
                      className={`${inputClass} w-28`}
                      value={line.qty}
                      onChange={event => updateLine(line.goodsReceiptLineId, 'qty', event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p>{line.batchNo || 'No batch'}</p>
                    <p className="text-xs text-secondary-text/55">{line.bin || 'No bin'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select className={inputClass} value={line.reason} onChange={event => updateLine(line.goodsReceiptLineId, 'reason', event.target.value)}>
                      <option value="QUALITY_REJECTION">Quality rejection</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="EXCESS">Excess</option>
                      <option value="WRONG_ITEM">Wrong item</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass} value={line.remarks} onChange={event => updateLine(line.goodsReceiptLineId, 'remarks', event.target.value)} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-secondary-text/55">Select a GRN with returnable accepted stock.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-color-100 bg-secondary p-4">
        <Field label="Return notes">
          <textarea className={`${inputClass} min-h-20`} value={form.notes} onChange={event => updateField('notes', event.target.value)} />
        </Field>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 rounded-xl border border-color-100 bg-secondary/95 p-3 shadow-lg backdrop-blur">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => router.back()}>Cancel</button>
        <SubmitButton label="Save draft" loading={saving} onClick={() => save(false)} />
        <SubmitButton label="Save & post return" loading={saving} className="bg-red-600 hover:bg-red-700" onClick={() => save(true)} />
      </div>
    </div>
  );
}
