'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/Components/Loading';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import ProcurementStatusBadge from './ProcurementStatusBadge';
import { ErrorBanner, PageTitle, inputClass } from './ProcurementUI';
import {
  money,
  procurementApi,
  shortDate,
  supplierName,
  warehouseName,
} from '../lib/procurementApi';

const CONFIG = {
  orders: {
    get: procurementApi.getOrder,
    action: procurementApi.orderAction,
    number: row => row.poNumber,
    title: 'Purchase order',
    date: row => row.orderDate,
  },
  receipts: {
    get: procurementApi.getReceipt,
    action: procurementApi.receiptAction,
    number: row => row.grnNumber,
    title: 'Goods receipt',
    date: row => row.receivedAt,
  },
  returns: {
    get: procurementApi.getReturn,
    action: procurementApi.returnAction,
    number: row => row.returnNumber,
    title: 'Purchase return',
    date: row => row.returnDate,
  },
  invoices: {
    get: procurementApi.getInvoice,
    action: procurementApi.invoiceAction,
    number: row => row.invoiceNumber,
    title: 'Purchase invoice',
    date: row => row.invoiceDate,
  },
};

function actionsFor(kind, document, can) {
  if (kind === 'orders') {
    const actions = [];
    if (['DRAFT', 'REJECTED'].includes(document.status) && can('procurement:update')) {
      actions.push({
        href: `/procurement/orders/${document._id}/edit`,
        label: 'Edit order',
      });
    }
    if (['DRAFT', 'REJECTED'].includes(document.status) && can('procurement:submit')) {
      actions.push({ action: 'submit', label: 'Submit for approval', primary: true });
    }
    if (document.status === 'PENDING_APPROVAL' && can('procurement:approve')) {
      actions.push({ action: 'approve', label: 'Approve', primary: true });
      actions.push({ action: 'reject', label: 'Reject', dangerous: true, requiresNote: true });
    }
    if (['APPROVED', 'PARTIALLY_RECEIVED'].includes(document.status) && can('procurement:receive')) {
      actions.push({
        href: `/procurement/receipts/new?purchaseOrderId=${document._id}`,
        label: 'Receive goods',
        primary: true,
      });
    }
    if (['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(document.status) && can('procurement:approve')) {
      actions.push({ action: 'close', label: 'Close order' });
    }
    if (['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'APPROVED'].includes(document.status) && can('procurement:cancel')) {
      actions.push({ action: 'cancel', label: 'Cancel', dangerous: true });
    }
    return actions;
  }
  if (kind === 'receipts' && document.status === 'DRAFT') {
    return [
      ...(can('procurement:receive')
        ? [{ href: `/procurement/receipts/${document._id}/edit`, label: 'Edit receipt' }]
        : []),
      ...(can('procurement:receive')
        ? [{ action: 'post', label: 'Post to inventory', primary: true }]
        : []),
      ...(can('procurement:cancel')
        ? [{ action: 'cancel', label: 'Cancel', dangerous: true }]
        : []),
    ];
  }
  if (kind === 'returns' && document.status === 'DRAFT') {
    return [
      ...(can('procurement:return')
        ? [{ href: `/procurement/returns/${document._id}/edit`, label: 'Edit return' }]
        : []),
      ...(can('procurement:return')
        ? [{ action: 'post', label: 'Post stock return', primary: true }]
        : []),
      ...(can('procurement:cancel')
        ? [{ action: 'cancel', label: 'Cancel', dangerous: true }]
        : []),
    ];
  }
  if (kind === 'invoices') {
    if (document.status === 'DRAFT' && can('procurement:invoice')) {
      return [
        { href: `/procurement/invoices/${document._id}/edit`, label: 'Edit invoice' },
        { action: 'verify', label: 'Run three-way match', primary: true },
        ...(can('procurement:cancel') ? [{ action: 'cancel', label: 'Cancel', dangerous: true }] : []),
      ];
    }
    if (document.status === 'VERIFIED') {
      return [
        ...(can('procurement:approve')
          ? [{
              action: 'approve',
              label: document.matchStatus === 'VARIANCE' ? 'Approve exception' : 'Approve invoice',
              primary: true,
              requiresNote: document.matchStatus === 'VARIANCE',
            }]
          : []),
        ...(can('procurement:cancel') ? [{ action: 'cancel', label: 'Cancel', dangerous: true }] : []),
      ];
    }
    if (document.status === 'APPROVED' && can('procurement:invoice')) {
      return [{ action: 'paid', label: 'Mark paid', primary: true }];
    }
  }
  return [];
}

function LineTable({ kind, document }) {
  const lines = document.lines || [];
  const headers = kind === 'orders'
    ? ['Item', 'Category', 'Ordered', 'Accepted', 'Quarantine', 'Returned', 'Unit price', 'Total']
    : kind === 'receipts'
      ? ['Item', 'Received', 'Accepted', 'Rejected', 'Quarantine', 'Batch', 'Bin', 'Inspection']
      : kind === 'returns'
        ? ['Item', 'Quantity', 'UOM', 'Batch', 'Bin', 'Reason', 'Remarks']
        : ['Item', 'Quantity', 'UOM', 'Unit price', 'Discount', 'Tax', 'Total'];
  const cells = line => {
    if (kind === 'orders') {
      return [
        line.itemName,
        line.categoryKey,
        `${line.orderedQty} ${line.uom}`,
        line.acceptedQty,
        line.quarantinedQty,
        line.returnedQty,
        money(line.unitPrice, document.currency),
        money(line.lineTotal, document.currency),
      ];
    }
    if (kind === 'receipts') {
      return [
        line.itemName,
        `${line.receivedQty} ${line.uom}`,
        line.acceptedQty,
        line.rejectedQty,
        line.quarantinedQty,
        line.batchNo || '—',
        line.bin || '—',
        line.inspectionStatus,
      ];
    }
    if (kind === 'returns') {
      return [
        line.itemName,
        line.qty,
        line.uom,
        line.batchNo || '—',
        line.bin || '—',
        line.reason?.replaceAll('_', ' '),
        line.remarks || '—',
      ];
    }
    return [
      line.itemName,
      line.invoicedQty,
      line.uom,
      money(line.unitPrice, document.currency),
      `${line.discountPercent}%`,
      `${line.taxPercent}%`,
      money(line.lineTotal, document.currency),
    ];
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="bg-primary text-xs uppercase text-primary-text/65">
          <tr>{headers.map(header => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-color-100">
          {lines.map(line => (
            <tr key={line._id}>
              {cells(line).map((cell, index) => (
                <td key={`${line._id}-${headers[index]}`} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocumentDetail({ kind, id }) {
  const config = CONFIG[kind];
  const router = useRouter();
  const { can } = useAuthz();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [qcResolution, setQcResolution] = useState({});

  const load = useCallback(async signal => {
    setLoading(true);
    setError('');
    try {
      const result = await config.get(id, { signal });
      setDocument(result.data);
      if (kind === 'receipts') {
        setQcResolution(Object.fromEntries(
          (result.data.lines || []).map(line => {
            const pending = Math.max(
              0,
              Number(line.quarantinedQty || 0)
              - Number(line.quarantineAcceptedQty || 0)
              - Number(line.quarantineRejectedQty || 0),
            );
            return [line._id, { acceptedQty: pending, rejectedQty: 0 }];
          }),
        ));
      }
    } catch (requestError) {
      if (requestError?.code !== 'ERR_CANCELED') {
        setError(getApiErrorMessage(requestError, `Unable to load ${config.title.toLowerCase()}.`));
      }
    } finally {
      setLoading(false);
    }
  }, [config, id, kind]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const actions = useMemo(
    () => document ? actionsFor(kind, document, can) : [],
    [can, document, kind],
  );

  const performAction = async action => {
    if (action.requiresNote && !note.trim()) {
      setError('Add a note before performing this action.');
      return;
    }
    if (
      action.dangerous
      && !window.confirm(`Are you sure you want to ${action.label.toLowerCase()}?`)
    ) return;
    setWorking(action.action);
    setError('');
    try {
      const result = await config.action(id, action.action, note);
      setNote('');
      Toast.success(result.message || `${action.label} completed`);
      await load();
      router.refresh();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Unable to ${action.label.toLowerCase()}.`));
    } finally {
      setWorking('');
    }
  };

  const pendingQuarantineLines = kind === 'receipts'
    ? (document?.lines || []).filter(line => (
        Number(line.quarantinedQty || 0)
        - Number(line.quarantineAcceptedQty || 0)
        - Number(line.quarantineRejectedQty || 0)
      ) > 0)
    : [];

  const resolveInspection = async () => {
    const lines = pendingQuarantineLines.map(line => ({
      goodsReceiptLineId: line._id,
      acceptedQty: Number(qcResolution[line._id]?.acceptedQty || 0),
      rejectedQty: Number(qcResolution[line._id]?.rejectedQty || 0),
    }));
    const incomplete = pendingQuarantineLines.find(line => {
      const pending = Number(line.quarantinedQty)
        - Number(line.quarantineAcceptedQty || 0)
        - Number(line.quarantineRejectedQty || 0);
      const resolution = qcResolution[line._id] || {};
      return Math.abs(
        Number(resolution.acceptedQty || 0)
        + Number(resolution.rejectedQty || 0)
        - pending,
      ) > 0.000001;
    });
    if (incomplete) {
      setError(`Resolve the full pending quantity for ${incomplete.itemName}.`);
      return;
    }
    setWorking('resolve-inspection');
    setError('');
    try {
      const result = await procurementApi.resolveReceiptInspection(id, { lines, note });
      setNote('');
      Toast.success(result.message || 'Quarantine inspection resolved');
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to resolve quarantine inspection.'));
    } finally {
      setWorking('');
    }
  };

  if (loading) {
    return <div className="flex min-h-72 items-center justify-center"><Loading text="Loading document…" /></div>;
  }
  if (!document) {
    return <ErrorBanner message={error || 'Document not found.'} onRetry={() => load()} />;
  }

  const documentNumber = config.number(document);
  const isInvoice = kind === 'invoices';
  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow={config.title}
        title={documentNumber}
        description={`${supplierName(document)} · ${shortDate(config.date(document))}`}
        action={<ProcurementStatusBadge value={document.status} />}
      />
      <ErrorBanner message={error} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <p className="text-xs uppercase text-secondary-text/55">Supplier</p>
          <p className="mt-1 font-medium">{supplierName(document)}</p>
          <p className="text-xs text-secondary-text/55">{document.supplierId?.code || document.supplierSnapshot?.code}</p>
        </div>
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <p className="text-xs uppercase text-secondary-text/55">
            {kind === 'invoices' ? 'Supplier invoice' : 'Warehouse'}
          </p>
          <p className="mt-1 font-medium">
            {isInvoice ? document.supplierInvoiceNumber : warehouseName(document)}
          </p>
          <p className="text-xs text-secondary-text/55">
            {kind === 'orders' ? `Expected ${shortDate(document.expectedDeliveryDate)}` : ''}
          </p>
        </div>
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <p className="text-xs uppercase text-secondary-text/55">Lines</p>
          <p className="mt-1 text-xl font-semibold">{document.lines?.length || 0}</p>
          {isInvoice && <ProcurementStatusBadge value={document.matchStatus} />}
        </div>
        <div className="rounded-xl border border-color-100 bg-secondary p-4">
          <p className="text-xs uppercase text-secondary-text/55">
            {document.totals ? 'Document value' : 'Total quantity'}
          </p>
          <p className="mt-1 text-xl font-semibold">
            {document.totals
              ? money(document.totals.grandTotal, document.currency)
              : document.lines?.reduce(
                  (sum, line) => sum + Number(line.receivedQty ?? line.qty ?? 0),
                  0,
                )}
          </p>
        </div>
      </section>

      {(document.purchaseOrderId || document.goodsReceiptId) && (
        <section className="flex flex-wrap gap-3 rounded-xl border border-color-100 bg-secondary px-4 py-3 text-sm">
          {document.purchaseOrderId && (
            <span>
              Purchase order:{' '}
              <Link
                href={`/procurement/orders/${document.purchaseOrderId._id || document.purchaseOrderId}`}
                className="font-medium text-action hover:underline"
              >
                {document.purchaseOrderId.poNumber || 'View order'}
              </Link>
            </span>
          )}
          {document.goodsReceiptId && (
            <span>
              Goods receipt:{' '}
              <Link
                href={`/procurement/receipts/${document.goodsReceiptId._id || document.goodsReceiptId}`}
                className="font-medium text-action hover:underline"
              >
                {document.goodsReceiptId.grnNumber || 'View receipt'}
              </Link>
            </span>
          )}
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        <div className="border-b border-color-100 px-4 py-3">
          <h2 className="font-medium">Line details</h2>
        </div>
        <LineTable kind={kind} document={document} />
      </section>

      {pendingQuarantineLines.length > 0 && can('procurement:receive') && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div>
            <h2 className="font-medium text-amber-500">Resolve quarantined material</h2>
            <p className="mt-1 text-xs text-secondary-text/60">
              Accepted quantity posts to inventory; rejected quantity remains outside stock.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {pendingQuarantineLines.map(line => {
              const pending = Number(line.quarantinedQty)
                - Number(line.quarantineAcceptedQty || 0)
                - Number(line.quarantineRejectedQty || 0);
              return (
                <div key={line._id} className="grid items-end gap-3 rounded-lg border border-amber-500/20 bg-secondary p-3 md:grid-cols-[minmax(180px,1fr)_140px_140px]">
                  <div>
                    <p className="font-medium">{line.itemName}</p>
                    <p className="text-xs text-secondary-text/55">
                      Pending {pending} {line.uom} · {line.batchNo || 'No batch'}
                    </p>
                  </div>
                  <label className="text-xs">
                    <span className="mb-1 block">Accept</span>
                    <input
                      type="number"
                      min="0"
                      max={pending}
                      step="any"
                      className={inputClass}
                      value={qcResolution[line._id]?.acceptedQty ?? pending}
                      onChange={event => setQcResolution(current => ({
                        ...current,
                        [line._id]: {
                          ...current[line._id],
                          acceptedQty: event.target.value,
                        },
                      }))}
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block">Reject</span>
                    <input
                      type="number"
                      min="0"
                      max={pending}
                      step="any"
                      className={inputClass}
                      value={qcResolution[line._id]?.rejectedQty ?? 0}
                      onChange={event => setQcResolution(current => ({
                        ...current,
                        [line._id]: {
                          ...current[line._id],
                          rejectedQty: event.target.value,
                        },
                      }))}
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <textarea
            className={`${inputClass} mt-3 min-h-16`}
            placeholder="Inspection note"
            value={note}
            onChange={event => setNote(event.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <SubmitButton
              label="Resolve inspection"
              loading={working === 'resolve-inspection'}
              disabled={Boolean(working)}
              className="bg-amber-600 hover:bg-amber-700"
              onClick={resolveInspection}
            />
          </div>
        </section>
      )}

      {isInvoice && document.variances?.length > 0 && (
        <section className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <h2 className="font-medium text-orange-500">Match exceptions</h2>
          <div className="mt-3 space-y-2">
            {document.variances.map(variance => (
              <div key={variance._id} className="rounded-lg border border-orange-500/20 bg-secondary p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <ProcurementStatusBadge value={variance.type} />
                  <span className="text-xs text-secondary-text/55">
                    Expected {variance.expected} · Actual {variance.actual}
                  </span>
                </div>
                <p className="mt-2">{variance.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {document.statusHistory?.length > 0 && (
        <section className="rounded-xl border border-color-100 bg-secondary p-4">
          <h2 className="font-medium">Audit trail</h2>
          <div className="mt-3 space-y-3">
            {[...document.statusHistory].reverse().map(entry => (
              <div key={entry._id} className="flex gap-3 border-l-2 border-action/30 pl-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{entry.action?.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-secondary-text/55">
                    {new Date(entry.at).toLocaleString('en-IN')}
                    {entry.by?.fullName ? ` · ${entry.by.fullName}` : ''}
                  </p>
                  {entry.note && <p className="mt-1 text-secondary-text/75">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {actions.length > 0 && (
        <section className="sticky bottom-0 rounded-xl border border-color-100 bg-secondary/95 p-3 shadow-lg backdrop-blur">
          {actions.some(action => action.requiresNote) && (
            <textarea
              className={`${inputClass} mb-3 min-h-16`}
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Decision note / reason"
            />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map(action => action.href ? (
              <Link key={action.href} href={action.href} className="btn-primary">
                {action.label}
              </Link>
            ) : (
              <SubmitButton
                key={action.action}
                label={action.label}
                loading={working === action.action}
                disabled={Boolean(working)}
                className={action.dangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : action.primary ? 'bg-action hover:bg-action-hover' : ''}
                onClick={() => performAction(action)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
