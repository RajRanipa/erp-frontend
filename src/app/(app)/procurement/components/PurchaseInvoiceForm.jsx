'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import { ErrorBanner, Field, PageTitle, inputClass } from './ProcurementUI';
import { money, procurementApi, supplierName } from '../lib/procurementApi';

const today = () => new Date().toISOString().slice(0, 10);
const buildLines = (order, invoice = null) => {
  const invoiceByPoLine = new Map(
    (invoice?.lines || []).map(line => [String(line.poLineId), line]),
  );
  return (order?.lines || []).map(line => {
    const invoiceLine = invoiceByPoLine.get(String(line._id));
    return {
      poLineId: line._id,
      itemName: line.itemName,
      uom: line.uom,
      orderedQty: Number(line.orderedQty),
      netAccepted: Math.max(0, Number(line.acceptedQty || 0) - Number(line.returnedQty || 0)),
      invoicedQty: invoiceLine?.invoicedQty
        ?? Math.max(0, Number(line.acceptedQty || 0) - Number(line.returnedQty || 0)),
      unitPrice: invoiceLine?.unitPrice ?? Number(line.unitPrice || 0),
      discountPercent: invoiceLine?.discountPercent ?? Number(line.discountPercent || 0),
      taxPercent: invoiceLine?.taxPercent ?? Number(line.taxPercent || 0),
    };
  });
};

const lineTotal = line => {
  const subtotal = Number(line.invoicedQty || 0) * Number(line.unitPrice || 0);
  const discounted = subtotal * (1 - Number(line.discountPercent || 0) / 100);
  return discounted * (1 + Number(line.taxPercent || 0) / 100);
};

export default function PurchaseInvoiceForm({ invoiceId = null }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    purchaseOrderId: '',
    supplierInvoiceNumber: '',
    invoiceDate: today(),
    dueDate: '',
    freight: 0,
    otherCharges: 0,
    roundOff: 0,
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
        const statuses = ['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'];
        const results = await Promise.all(statuses.map(status =>
          procurementApi.listOrders({ status, limit: 100 }, { signal: controller.signal })
        ));
        const existing = invoiceId
          ? await procurementApi.getInvoice(invoiceId, { signal: controller.signal })
          : null;
        const existingInvoice = existing?.data;
        const existingOrderId = existingInvoice
          ? String(existingInvoice.purchaseOrderId?._id || existingInvoice.purchaseOrderId)
          : null;
        const existingOrder = existingOrderId
          ? await procurementApi.getOrder(existingOrderId, { signal: controller.signal })
          : null;
        const orderMap = new Map(
          results.flatMap(result => result.data || []).map(order => [String(order._id), order]),
        );
        if (existingOrder?.data) orderMap.set(String(existingOrder.data._id), existingOrder.data);
        setOrders([...orderMap.values()]);
        if (existingInvoice && existingOrder?.data) {
          setSelectedOrder(existingOrder.data);
          setForm({
            purchaseOrderId: existingOrderId,
            supplierInvoiceNumber: existingInvoice.supplierInvoiceNumber || '',
            invoiceDate: existingInvoice.invoiceDate?.slice(0, 10) || today(),
            dueDate: existingInvoice.dueDate?.slice(0, 10) || '',
            freight: existingInvoice.freight || 0,
            otherCharges: existingInvoice.otherCharges || 0,
            roundOff: existingInvoice.roundOff || 0,
            notes: existingInvoice.notes || '',
            lines: buildLines(existingOrder.data, existingInvoice),
          });
        } else {
          const requested = new URLSearchParams(window.location.search).get('purchaseOrderId');
          if (requested) await selectOrder(requested, controller.signal);
        }
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, 'Unable to load approved purchase orders.'));
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [invoiceId, selectOrder]);

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateLine = (id, field, value) => setForm(current => ({
    ...current,
    lines: current.lines.map(line => line.poLineId === id ? { ...line, [field]: value } : line),
  }));
  const totals = useMemo(() => {
    const linesTotal = form.lines.reduce((sum, line) => sum + lineTotal(line), 0);
    return linesTotal
      + Number(form.freight || 0)
      + Number(form.otherCharges || 0)
      + Number(form.roundOff || 0);
  }, [form]);

  const save = async verifyAfterSave => {
    if (!form.purchaseOrderId) return setError('Select a purchase order.');
    if (!form.supplierInvoiceNumber.trim()) return setError('Supplier invoice number is required.');
    const lines = form.lines.filter(line => Number(line.invoicedQty) > 0);
    if (!lines.length) return setError('Enter an invoiced quantity on at least one line.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        lines: lines.map(({ itemName, uom, orderedQty, netAccepted, ...line }) => line),
      };
      const created = invoiceId
        ? await procurementApi.updateInvoice(invoiceId, payload)
        : await procurementApi.createInvoice(payload);
      if (verifyAfterSave) {
        const verified = await procurementApi.invoiceAction(created.data._id, 'verify');
        Toast.success(
          verified.data.matchStatus === 'MATCHED'
            ? 'Invoice saved and three-way match passed'
            : `Invoice saved with ${verified.data.variances?.length || 0} exception(s)`,
        );
      } else {
        Toast.success(`${created.data.invoiceNumber} saved as draft`);
      }
      router.push(`/procurement/invoices/${created.data._id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save the purchase invoice.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Accounts payable"
        title={invoiceId ? 'Edit purchase invoice' : 'Record purchase invoice'}
        description="Invoice quantity and price are matched against the PO and net accepted GRN quantity."
      />
      <ErrorBanner message={error} />

      <section className="grid gap-4 rounded-xl border border-color-100 bg-secondary p-4 lg:grid-cols-4">
        <Field label="Purchase order" required>
          <select
            className={inputClass}
            value={form.purchaseOrderId}
            disabled={loading || Boolean(invoiceId)}
            onChange={async event => {
              setLoading(true);
              try {
                await selectOrder(event.target.value);
              } catch (requestError) {
                setError(getApiErrorMessage(requestError, 'Unable to load purchase order.'));
              } finally {
                setLoading(false);
              }
            }}
          >
            <option value="">Select purchase order</option>
            {orders.map(order => (
              <option key={order._id} value={order._id}>
                {order.poNumber} · {supplierName(order)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supplier invoice number" required>
          <input className={inputClass} value={form.supplierInvoiceNumber} onChange={event => updateField('supplierInvoiceNumber', event.target.value.toUpperCase())} />
        </Field>
        <Field label="Invoice date" required>
          <input type="date" className={inputClass} value={form.invoiceDate} onChange={event => updateField('invoiceDate', event.target.value)} />
        </Field>
        <Field label="Due date">
          <input type="date" min={form.invoiceDate} className={inputClass} value={form.dueDate} onChange={event => updateField('dueDate', event.target.value)} />
        </Field>
        <div className="rounded-lg bg-primary p-3 text-sm lg:col-span-2">
          <p className="text-xs uppercase text-primary-text/55">Supplier</p>
          <p className="mt-1 font-medium">{selectedOrder ? supplierName(selectedOrder) : '—'}</p>
          <p className="text-xs text-primary-text/55">{selectedOrder?.supplierSnapshot?.taxId || ''}</p>
        </div>
        <div className="rounded-lg bg-primary p-3 text-sm">
          <p className="text-xs uppercase text-primary-text/55">Currency</p>
          <p className="mt-1 font-medium">{selectedOrder?.currency || 'INR'}</p>
        </div>
        <div className="rounded-lg bg-primary p-3 text-sm">
          <p className="text-xs uppercase text-primary-text/55">PO value</p>
          <p className="mt-1 font-medium">{money(selectedOrder?.totals?.grandTotal, selectedOrder?.currency)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        <div className="border-b border-color-100 px-4 py-3">
          <h2 className="font-medium">Invoice lines</h2>
          <p className="text-xs text-secondary-text/55">Changing the PO price will be reported as a three-way match exception.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="bg-primary text-xs uppercase text-primary-text/65">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Ordered</th>
                <th className="px-4 py-3">Net accepted</th>
                <th className="px-4 py-3">Invoice qty</th>
                <th className="px-4 py-3">Unit price</th>
                <th className="px-4 py-3">Discount %</th>
                <th className="px-4 py-3">Tax %</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-100">
              {form.lines.length ? form.lines.map(line => (
                <tr key={line.poLineId}>
                  <td className="px-4 py-3 font-medium">{line.itemName}</td>
                  <td className="px-4 py-3">{line.orderedQty} {line.uom}</td>
                  <td className={`px-4 py-3 ${line.netAccepted === 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {line.netAccepted} {line.uom}
                  </td>
                  {[
                    ['invoicedQty', 'any', 0],
                    ['unitPrice', '0.01', 0],
                    ['discountPercent', '0.01', 0],
                    ['taxPercent', '0.01', 0],
                  ].map(([field, step, min]) => (
                    <td key={field} className="px-4 py-3">
                      <input
                        type="number"
                        min={min}
                        max={field.includes('Percent') ? 100 : undefined}
                        step={step}
                        className={`${inputClass} w-28`}
                        value={line[field]}
                        onChange={event => updateLine(line.poLineId, field, event.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-medium">
                    {money(lineTotal(line), selectedOrder?.currency)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-secondary-text/55">Select a purchase order to load lines.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <Field label="Invoice notes">
            <textarea className={`${inputClass} min-h-24`} value={form.notes} onChange={event => updateField('notes', event.target.value)} />
          </Field>
        </div>
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <h2 className="font-medium">Invoice total</h2>
          <div className="mt-3 space-y-3 text-sm">
            {[
              ['freight', 'Freight'],
              ['otherCharges', 'Other charges'],
              ['roundOff', 'Round off'],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center justify-between gap-4">
                <span>{label}</span>
                <input
                  type="number"
                  step="0.01"
                  min={field === 'roundOff' ? undefined : 0}
                  className={`${inputClass} w-32 text-right`}
                  value={form[field]}
                  onChange={event => updateField(field, event.target.value)}
                />
              </label>
            ))}
            <div className="flex justify-between border-t border-color-100 pt-3 text-base font-semibold">
              <span>Grand total</span>
              <span>{money(totals, selectedOrder?.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 rounded-xl border border-color-100 bg-secondary/95 p-3 shadow-lg backdrop-blur">
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => router.back()}>Cancel</button>
        <SubmitButton label="Save draft" loading={saving} onClick={() => save(false)} />
        <SubmitButton label="Save & match" loading={saving} className="bg-action hover:bg-action-hover" onClick={() => save(true)} />
      </div>
    </div>
  );
}
