'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import { ErrorBanner, Field, PageTitle, inputClass } from './ProcurementUI';
import { procurementApi, supplierName, warehouseName } from '../lib/procurementApi';

const today = () => new Date().toISOString().slice(0, 10);

const buildLines = (order, receipt = null) => {
  const receiptByPoLine = new Map(
    (receipt?.lines || []).map(line => [String(line.poLineId), line]),
  );
  return (order?.lines || [])
  .map(line => ({
    poLineId: line._id,
    itemName: line.itemName,
    categoryKey: line.categoryKey,
    uom: line.uom,
    orderedQty: Number(line.orderedQty),
    acceptedBefore: Number(line.acceptedQty || 0),
    quarantinedBefore: Number(line.quarantinedQty || 0),
    outstanding: Math.max(
      0,
      Number(line.orderedQty) - Number(line.acceptedQty || 0) - Number(line.quarantinedQty || 0),
    ),
    acceptedQty: receiptByPoLine.get(String(line._id))?.acceptedQty || 0,
    rejectedQty: receiptByPoLine.get(String(line._id))?.rejectedQty || 0,
    quarantinedQty: receiptByPoLine.get(String(line._id))?.quarantinedQty || 0,
    supplierBatchNo: receiptByPoLine.get(String(line._id))?.supplierBatchNo || '',
    batchNo: receiptByPoLine.get(String(line._id))?.batchNo || '',
    bin: receiptByPoLine.get(String(line._id))?.bin || '',
    manufacturedAt: receiptByPoLine.get(String(line._id))?.manufacturedAt?.slice(0, 10) || '',
    expiresAt: receiptByPoLine.get(String(line._id))?.expiresAt?.slice(0, 10) || '',
    remarks: receiptByPoLine.get(String(line._id))?.remarks || '',
  }))
  .filter(line => line.outstanding > 0);
};

export default function GoodsReceiptForm({ receiptId = null }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    purchaseOrderId: '',
    receivedAt: today(),
    supplierInvoiceNo: '',
    deliveryChallanNo: '',
    vehicleNo: '',
    transporterName: '',
    notes: '',
    lines: [],
  });

  const selectOrder = useCallback(async (orderId, signal) => {
    if (!orderId) {
      setSelectedOrder(null);
      setForm(current => ({ ...current, purchaseOrderId: '', lines: [] }));
      return;
    }
    const result = await procurementApi.getOrder(orderId, { signal });
    setSelectedOrder(result.data);
    setForm(current => ({
      ...current,
      purchaseOrderId: orderId,
      lines: buildLines(result.data),
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [approved, partial] = await Promise.all([
          procurementApi.listOrders({ status: 'APPROVED', limit: 100 }, { signal: controller.signal }),
          procurementApi.listOrders({ status: 'PARTIALLY_RECEIVED', limit: 100 }, { signal: controller.signal }),
        ]);
        const existing = receiptId
          ? await procurementApi.getReceipt(receiptId, { signal: controller.signal })
          : null;
        const existingReceipt = existing?.data;
        const existingOrderId = existingReceipt
          ? String(existingReceipt.purchaseOrderId?._id || existingReceipt.purchaseOrderId)
          : null;
        let existingOrder = null;
        if (existingOrderId) {
          existingOrder = await procurementApi.getOrder(existingOrderId, { signal: controller.signal });
        }
        const availableMap = new Map(
          [...(approved.data || []), ...(partial.data || [])]
            .map(order => [String(order._id), order]),
        );
        if (existingOrder?.data) availableMap.set(String(existingOrder.data._id), existingOrder.data);
        const available = [...availableMap.values()];
        setOrders(available);
        if (existingReceipt && existingOrder?.data) {
          setSelectedOrder(existingOrder.data);
          setForm({
            purchaseOrderId: existingOrderId,
            receivedAt: existingReceipt.receivedAt?.slice(0, 10) || today(),
            supplierInvoiceNo: existingReceipt.supplierInvoiceNo || '',
            deliveryChallanNo: existingReceipt.deliveryChallanNo || '',
            vehicleNo: existingReceipt.vehicleNo || '',
            transporterName: existingReceipt.transporterName || '',
            notes: existingReceipt.notes || '',
            lines: buildLines(existingOrder.data, existingReceipt),
          });
        } else {
          const requestedOrder = new URLSearchParams(window.location.search).get('purchaseOrderId');
          if (requestedOrder) await selectOrder(requestedOrder, controller.signal);
        }
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, 'Unable to load receivable purchase orders.'));
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [receiptId, selectOrder]);

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateLine = (poLineId, field, value) => setForm(current => ({
    ...current,
    lines: current.lines.map(line => (
      line.poLineId === poLineId ? { ...line, [field]: value } : line
    )),
  }));

  const totalReceived = useMemo(
    () => form.lines.reduce(
      (sum, line) => sum
        + Number(line.acceptedQty || 0)
        + Number(line.rejectedQty || 0)
        + Number(line.quarantinedQty || 0),
      0,
    ),
    [form.lines],
  );

  const save = async postAfterSave => {
    if (!form.purchaseOrderId) return setError('Select a purchase order.');
    const activeLines = form.lines.filter(line => (
      Number(line.acceptedQty || 0)
      + Number(line.rejectedQty || 0)
      + Number(line.quarantinedQty || 0)
    ) > 0);
    if (!activeLines.length) return setError('Enter a received quantity on at least one line.');
    const exceeds = activeLines.find(line => (
      Number(line.acceptedQty || 0) + Number(line.quarantinedQty || 0)
      > Number(line.outstanding)
    ));
    if (exceeds) return setError(`${exceeds.itemName} exceeds its outstanding quantity.`);

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        lines: activeLines.map(({
          itemName,
          categoryKey,
          uom,
          orderedQty,
          acceptedBefore,
          quarantinedBefore,
          outstanding,
          ...line
        }) => line),
      };
      const created = receiptId
        ? await procurementApi.updateReceipt(receiptId, payload)
        : await procurementApi.createReceipt(payload);
      if (postAfterSave) {
        await procurementApi.receiptAction(created.data._id, 'post');
        Toast.success(`${created.data.grnNumber} posted to inventory`);
      } else {
        Toast.success(`${created.data.grnNumber} saved as draft`);
      }
      router.push(`/procurement/receipts/${created.data._id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save the goods receipt.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Inbound logistics"
        title={receiptId ? 'Edit goods receipt' : 'Receive supplier goods'}
        description="Accepted quantity posts to inventory; rejected and quarantined quantities remain outside available stock."
      />
      <ErrorBanner message={error} />

      <section className="grid gap-4 rounded-xl border border-color-100 bg-secondary p-4 lg:grid-cols-4">
        <Field label="Purchase order" required>
          <select
            className={inputClass}
            value={form.purchaseOrderId}
            disabled={loading || Boolean(receiptId)}
            onChange={async event => {
              setLoading(true);
              setError('');
              try {
                await selectOrder(event.target.value);
              } catch (requestError) {
                setError(getApiErrorMessage(requestError, 'Unable to load purchase order.'));
              } finally {
                setLoading(false);
              }
            }}
          >
            <option value="">Select approved order</option>
            {orders.map(order => (
              <option key={order._id} value={order._id}>
                {order.poNumber} · {supplierName(order)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Received date" required>
          <input type="date" className={inputClass} value={form.receivedAt} onChange={event => updateField('receivedAt', event.target.value)} />
        </Field>
        <Field label="Supplier invoice no.">
          <input className={inputClass} value={form.supplierInvoiceNo} onChange={event => updateField('supplierInvoiceNo', event.target.value)} />
        </Field>
        <Field label="Delivery challan no.">
          <input className={inputClass} value={form.deliveryChallanNo} onChange={event => updateField('deliveryChallanNo', event.target.value)} />
        </Field>
        <Field label="Vehicle no.">
          <input className={inputClass} value={form.vehicleNo} onChange={event => updateField('vehicleNo', event.target.value.toUpperCase())} />
        </Field>
        <Field label="Transporter">
          <input className={inputClass} value={form.transporterName} onChange={event => updateField('transporterName', event.target.value)} />
        </Field>
        <div className="rounded-lg bg-primary p-3 text-sm">
          <p className="text-xs uppercase text-primary-text/55">Supplier</p>
          <p className="mt-1 font-medium">{selectedOrder ? supplierName(selectedOrder) : '—'}</p>
        </div>
        <div className="rounded-lg bg-primary p-3 text-sm">
          <p className="text-xs uppercase text-primary-text/55">Destination</p>
          <p className="mt-1 font-medium">{selectedOrder ? warehouseName(selectedOrder) : '—'}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        <div className="flex items-center justify-between border-b border-color-100 px-4 py-3">
          <div>
            <h2 className="font-medium">Inspection & disposition</h2>
            <p className="text-xs text-secondary-text/55">Enter only the lines delivered today.</p>
          </div>
          <span className="rounded-full bg-action/10 px-3 py-1 text-sm font-medium text-action">
            Received: {totalReceived}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1260px] text-left text-sm">
            <thead className="bg-primary text-xs uppercase text-primary-text/65">
              <tr>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Outstanding</th>
                <th className="px-3 py-3">Accepted</th>
                <th className="px-3 py-3">Rejected</th>
                <th className="px-3 py-3">Quarantine</th>
                <th className="px-3 py-3">Supplier batch</th>
                <th className="px-3 py-3">Internal batch</th>
                <th className="px-3 py-3">Bin</th>
                <th className="px-3 py-3">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-100">
              {form.lines.length ? form.lines.map(line => (
                <tr key={line.poLineId}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{line.itemName}</p>
                    <p className="text-xs uppercase text-secondary-text/55">{line.categoryKey} · {line.uom}</p>
                  </td>
                  <td className="px-3 py-2 font-medium">{line.outstanding} {line.uom}</td>
                  {['acceptedQty', 'rejectedQty', 'quarantinedQty'].map(field => (
                    <td key={field} className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`${inputClass} w-28`}
                        value={line[field]}
                        onChange={event => updateLine(line.poLineId, field, event.target.value)}
                      />
                    </td>
                  ))}
                  {['supplierBatchNo', 'batchNo', 'bin'].map(field => (
                    <td key={field} className="px-3 py-2">
                      <input
                        className={`${inputClass} w-36`}
                        value={line[field]}
                        onChange={event => updateLine(line.poLineId, field, event.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className={`${inputClass} w-40`}
                      value={line.expiresAt}
                      onChange={event => updateLine(line.poLineId, 'expiresAt', event.target.value)}
                    />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="px-4 py-12 text-center text-secondary-text/55">Select an order to load outstanding lines.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-color-100 bg-secondary p-4">
        <Field label="Receiving notes">
          <textarea className={`${inputClass} min-h-20`} value={form.notes} onChange={event => updateField('notes', event.target.value)} />
        </Field>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 rounded-xl border border-color-100 bg-secondary/95 p-3 shadow-lg backdrop-blur">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => router.back()}>Cancel</button>
        <SubmitButton label="Save draft" loading={saving} onClick={() => save(false)} />
        <SubmitButton label="Save & post stock" loading={saving} className="bg-action hover:bg-action-hover" onClick={() => save(true)} />
      </div>
    </div>
  );
}
