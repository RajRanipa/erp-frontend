'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import { ErrorBanner, Field, PageTitle, inputClass } from './ProcurementUI';
import { money, procurementApi } from '../lib/procurementApi';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';

const today = () => new Date().toISOString().slice(0, 10);
const emptyLine = () => ({
  key: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  itemId: '',
  orderedQty: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxPercent: 0,
  description: '',
  hsnCode: '',
});

const commercial = line => {
  const subtotal = Number(line.orderedQty || 0) * Number(line.unitPrice || 0);
  const discount = subtotal * Number(line.discountPercent || 0) / 100;
  const taxable = subtotal - discount;
  const tax = taxable * Number(line.taxPercent || 0) / 100;
  return { subtotal, discount, taxable, tax, total: taxable + tax };
};

export default function PurchaseOrderForm({ orderId = null }) {
  const router = useRouter();
  const { can } = useAuthz();
  const [lookups, setLookups] = useState({ suppliers: [], warehouses: [], items: [] });
  const [itemSearch, setItemSearch] = useState('');
  const deferredItemSearch = useDeferredValue(itemSearch);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    orderDate: today(),
    expectedDeliveryDate: '',
    currency: 'INR',
    paymentTerms: { type: 'NET_DAYS', netDays: 30, note: '' },
    freight: 0,
    otherCharges: 0,
    roundOff: 0,
    internalReference: '',
    notes: '',
    terms: '',
    lines: [emptyLine()],
  });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [suppliers, warehouses, items, existingOrder] = await Promise.all([
          procurementApi.lookup('suppliers', { limit: 100 }, { signal: controller.signal }),
          procurementApi.lookup('warehouses', { limit: 100 }, { signal: controller.signal }),
          procurementApi.lookup('items', { limit: 100 }, { signal: controller.signal }),
          orderId ? procurementApi.getOrder(orderId, { signal: controller.signal }) : null,
        ]);
        const order = existingOrder?.data;
        const orderItems = (order?.lines || []).map(line => ({
          _id: String(line.itemId?._id || line.itemId),
          name: line.itemName,
          sku: line.sku,
          categoryKey: line.categoryKey,
          UOM: line.uom,
          purchasePrice: line.unitPrice,
        }));
        const itemMap = new Map(
          [...(items.data || []), ...orderItems].map(item => [String(item._id), item]),
        );
        const supplierMap = new Map(
          [
            ...(suppliers.data || []),
            ...(order?.supplierId?._id ? [order.supplierId] : []),
          ].map(row => [String(row._id), row]),
        );
        const warehouseMap = new Map(
          [
            ...(warehouses.data || []),
            ...(order?.warehouseId?._id ? [order.warehouseId] : []),
          ].map(row => [String(row._id), row]),
        );
        setLookups({
          suppliers: [...supplierMap.values()],
          warehouses: [...warehouseMap.values()],
          items: [...itemMap.values()],
        });
        if (order) {
          setForm({
            supplierId: String(order.supplierId?._id || order.supplierId),
            warehouseId: String(order.warehouseId?._id || order.warehouseId),
            orderDate: order.orderDate?.slice(0, 10) || today(),
            expectedDeliveryDate: order.expectedDeliveryDate?.slice(0, 10) || '',
            currency: order.currency || 'INR',
            paymentTerms: order.paymentTerms || { type: 'NET_DAYS', netDays: 30, note: '' },
            freight: order.freight || 0,
            otherCharges: order.otherCharges || 0,
            roundOff: order.roundOff || 0,
            internalReference: order.internalReference || '',
            notes: order.notes || '',
            terms: order.terms || '',
            lines: (order.lines || []).map(line => ({
              key: line._id,
              itemId: String(line.itemId?._id || line.itemId),
              orderedQty: line.orderedQty,
              unitPrice: line.unitPrice,
              discountPercent: line.discountPercent,
              taxPercent: line.taxPercent,
              description: line.description || '',
              hsnCode: line.hsnCode || '',
            })),
          });
        }
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, 'Unable to load purchase-order master data.'));
        }
      } finally {
        setLoadingLookups(false);
      }
    })();
    return () => controller.abort();
  }, [orderId]);

  useEffect(() => {
    if (!deferredItemSearch.trim()) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await procurementApi.lookup(
          'items',
          { q: deferredItemSearch, limit: 100 },
          { signal: controller.signal },
        );
        setLookups(current => {
          const byId = new Map(current.items.map(item => [String(item._id), item]));
          for (const item of result.data || []) byId.set(String(item._id), item);
          return { ...current, items: [...byId.values()] };
        });
      } catch (requestError) {
        if (requestError?.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, 'Unable to search items.'));
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [deferredItemSearch]);

  const selectedSupplier = useMemo(
    () => lookups.suppliers.find(row => String(row._id) === String(form.supplierId)),
    [form.supplierId, lookups.suppliers],
  );

  const totals = useMemo(() => {
    const values = form.lines.map(commercial);
    const subtotal = values.reduce((sum, row) => sum + row.subtotal, 0);
    const discount = values.reduce((sum, row) => sum + row.discount, 0);
    const tax = values.reduce((sum, row) => sum + row.tax, 0);
    return {
      subtotal,
      discount,
      tax,
      grandTotal: subtotal - discount + tax
        + Number(form.freight || 0)
        + Number(form.otherCharges || 0)
        + Number(form.roundOff || 0),
    };
  }, [form]);

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateLine = (key, field, value) => {
    setForm(current => ({
      ...current,
      lines: current.lines.map(line => {
        if (line.key !== key) return line;
        if (field !== 'itemId') return { ...line, [field]: value };
        const item = lookups.items.find(row => String(row._id) === String(value));
        return {
          ...line,
          itemId: value,
          unitPrice: item?.purchasePrice || 0,
          description: item?.grade ? `${item.name} · ${item.grade}` : item?.name || '',
        };
      }),
    }));
  };

  const validate = () => {
    if (!form.supplierId) return 'Select a supplier.';
    if (!form.warehouseId) return 'Select a delivery warehouse.';
    if (!form.lines.length) return 'Add at least one item.';
    const invalidLine = form.lines.find(line => !line.itemId || Number(line.orderedQty) <= 0);
    if (invalidLine) return 'Every line needs an item and a quantity greater than zero.';
    if (new Set(form.lines.map(line => line.itemId)).size !== form.lines.length) {
      return 'Combine duplicate items into one line.';
    }
    return '';
  };

  const save = async submitAfterSave => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        lines: form.lines.map(({ key, ...line }) => line),
      };
      const created = orderId
        ? await procurementApi.updateOrder(orderId, payload)
        : await procurementApi.createOrder(payload);
      if (submitAfterSave) {
        await procurementApi.orderAction(created.data._id, 'submit');
        Toast.success(`${created.data.poNumber} saved and submitted`);
      } else {
        Toast.success(`${created.data.poNumber} saved as draft`);
      }
      router.push(`/procurement/orders/${created.data._id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save the purchase order.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="New commitment"
        title={orderId ? 'Edit purchase order' : 'Create purchase order'}
        description="Commercial totals are recalculated and validated by the server before saving."
      />
      <ErrorBanner message={error} />

      <section className="grid gap-4 rounded-xl border border-color-100 bg-secondary p-4 lg:grid-cols-4">
        <Field label="Supplier" required>
          <AdaptiveSelectInput
            className={inputClass}
            value={form.supplierId}
            disabled={loadingLookups}
            onChange={event => {
              const supplier = lookups.suppliers.find(row => row._id === event.target.value);
              setForm(current => ({
                ...current,
                supplierId: event.target.value,
                currency: supplier?.currency || current.currency,
                paymentTerms: supplier?.paymentTerms || current.paymentTerms,
              }));
            }}
            name="supplierId"
            placeholder="Select supplier"
            options={lookups.suppliers.map(supplier => ({
              value: supplier._id,
              label: `${supplier.code} · ${supplier.legalName || supplier.name}`,
            }))}
            required
          />
        </Field>
        <Field label="Delivery warehouse" required>
          <select
            className={inputClass}
            value={form.warehouseId}
            disabled={loadingLookups}
            onChange={event => updateField('warehouseId', event.target.value)}
          >
            <option value="">Select warehouse</option>
            {lookups.warehouses.map(warehouse => (
              <option key={warehouse._id} value={warehouse._id}>
                {warehouse.code} · {warehouse.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order date" required>
          <input
            type="date"
            className={inputClass}
            value={form.orderDate}
            onChange={event => updateField('orderDate', event.target.value)}
          />
        </Field>
        <Field label="Expected delivery">
          <input
            type="date"
            className={inputClass}
            min={form.orderDate}
            value={form.expectedDeliveryDate}
            onChange={event => updateField('expectedDeliveryDate', event.target.value)}
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClass}
            value={form.currency}
            maxLength={3}
            onChange={event => updateField('currency', event.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Payment terms">
          <select
            className={inputClass}
            value={form.paymentTerms.type}
            onChange={event => updateField('paymentTerms', {
              ...form.paymentTerms,
              type: event.target.value,
            })}
          >
            <option value="DUE_ON_RECEIPT">Due on receipt</option>
            <option value="NET_DAYS">Net days</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </Field>
        <Field label="Net days">
          <input
            type="number"
            min="0"
            max="3650"
            className={inputClass}
            disabled={form.paymentTerms.type !== 'NET_DAYS'}
            value={form.paymentTerms.netDays}
            onChange={event => updateField('paymentTerms', {
              ...form.paymentTerms,
              netDays: event.target.value,
            })}
          />
        </Field>
        <Field label="Internal reference">
          <input
            className={inputClass}
            value={form.internalReference}
            onChange={event => updateField('internalReference', event.target.value)}
            placeholder="Indent / request / project"
          />
        </Field>
      </section>

      <section className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-color-100 px-4 py-3">
          <div>
            <h2 className="font-medium">Order lines</h2>
            <p className="text-xs text-secondary-text/55">Item UOM is controlled by the item master.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              className={`${inputClass} w-64`}
              value={itemSearch}
              onChange={event => setItemSearch(event.target.value)}
              placeholder="Search item name, SKU, grade…"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => updateField('lines', [...form.lines, emptyLine()])}
              disabled={form.lines.length >= 200}
            >
              + Add line
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-primary text-left text-xs uppercase text-primary-text/65">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="min-w-64 px-3 py-3">Item</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">UOM</th>
                <th className="px-3 py-3">Unit price</th>
                <th className="px-3 py-3">Discount %</th>
                <th className="px-3 py-3">Tax %</th>
                <th className="px-3 py-3 text-right">Line total</th>
                <th className="px-3 py-3"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-100">
              {form.lines.map((line, index) => {
                const item = lookups.items.find(row => String(row._id) === String(line.itemId));
                return (
                  <tr key={line.key}>
                    <td className="px-3 py-2 text-secondary-text/55">{index + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        className={inputClass}
                        value={line.itemId}
                        onChange={event => updateLine(line.key, 'itemId', event.target.value)}
                      >
                        <option value="">Select item</option>
                        {lookups.items.map(option => (
                          <option key={option._id} value={option._id}>
                            [{option.categoryKey}] {option.sku || 'NO-SKU'} · {option.name}
                            {option.grade ? ` · ${option.grade}` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0.000001"
                        step="any"
                        className={`${inputClass} w-28`}
                        value={line.orderedQty}
                        onChange={event => updateLine(line.key, 'orderedQty', event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 uppercase text-secondary-text/70">{item?.UOM || '—'}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${inputClass} w-32`}
                        value={line.unitPrice}
                        onChange={event => updateLine(line.key, 'unitPrice', event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={`${inputClass} w-24`}
                        value={line.discountPercent}
                        onChange={event => updateLine(line.key, 'discountPercent', event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={`${inputClass} w-24`}
                        value={line.taxPercent}
                        onChange={event => updateLine(line.key, 'taxPercent', event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {money(commercial(line).total, form.currency)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded p-2 text-red-500 hover:bg-red-500/10"
                        onClick={() => updateField(
                          'lines',
                          form.lines.length === 1
                            ? [emptyLine()]
                            : form.lines.filter(row => row.key !== line.key),
                        )}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.notes}
              onChange={event => updateField('notes', event.target.value)}
              placeholder="Supplier-facing or internal delivery instructions"
            />
          </Field>
        </div>
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <h2 className="font-medium">Order total</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal, form.currency)}</span></div>
            <div className="flex justify-between text-secondary-text/65"><span>Discount</span><span>− {money(totals.discount, form.currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{money(totals.tax, form.currency)}</span></div>
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
              <span>Grand total</span><span>{money(totals.grandTotal, form.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 rounded-xl border border-color-100 bg-secondary/95 p-3 shadow-lg backdrop-blur">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={saving}>
          Cancel
        </button>
        <SubmitButton
          label="Save draft"
          loading={saving}
          onClick={() => save(false)}
        />
        {can('procurement:submit') && (
          <SubmitButton
            label="Save & submit"
            loading={saving}
            className="bg-action hover:bg-action-hover"
            onClick={() => save(true)}
          />
        )}
      </div>
      {selectedSupplier && (
        <p className="sr-only">Selected supplier: {selectedSupplier.legalName || selectedSupplier.name}</p>
      )}
    </div>
  );
}
