'use client';

import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';
import ProcurementStatusBadge from './ProcurementStatusBadge';
import {
  EmptyState,
  ErrorBanner,
  PageTitle,
  TableSkeleton,
  inputClass,
} from './ProcurementUI';
import {
  money,
  procurementApi,
  shortDate,
  supplierName,
  warehouseName,
} from '../lib/procurementApi';

const CONFIG = {
  orders: {
    title: 'Purchase orders',
    description: 'Commercial commitments with approval and delivery control.',
    permission: 'procurement:create',
    newHref: '/procurement/orders/new',
    newLabel: 'New purchase order',
    list: procurementApi.listOrders,
    statuses: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'REJECTED', 'CLOSED', 'CANCELLED'],
    empty: 'No purchase orders match these filters.',
    headers: ['Order', 'Supplier', 'Order date', 'Expected', 'Value', 'Status'],
    cells: row => [
      row.poNumber,
      supplierName(row),
      shortDate(row.orderDate),
      shortDate(row.expectedDeliveryDate),
      money(row.totals?.grandTotal, row.currency),
      row.status,
    ],
  },
  receipts: {
    title: 'Goods receipts',
    description: 'Inspect deliveries and post accepted quantities into inventory.',
    permission: 'procurement:receive',
    newHref: '/procurement/receipts/new',
    newLabel: 'Receive goods',
    list: procurementApi.listReceipts,
    statuses: ['DRAFT', 'POSTED', 'CANCELLED'],
    empty: 'No goods receipts match these filters.',
    headers: ['GRN', 'Purchase order', 'Supplier', 'Warehouse', 'Received', 'Status'],
    cells: row => [
      row.grnNumber,
      row.purchaseOrderId?.poNumber || '—',
      supplierName(row),
      warehouseName(row),
      shortDate(row.receivedAt),
      row.status,
    ],
  },
  returns: {
    title: 'Purchase returns',
    description: 'Send accepted material back with exact batch-level stock reversal.',
    permission: 'procurement:return',
    newHref: '/procurement/returns/new',
    newLabel: 'New return',
    list: procurementApi.listReturns,
    statuses: ['DRAFT', 'POSTED', 'CANCELLED'],
    empty: 'No purchase returns match these filters.',
    headers: ['Return', 'GRN', 'Purchase order', 'Supplier', 'Return date', 'Status'],
    cells: row => [
      row.returnNumber,
      row.goodsReceiptId?.grnNumber || '—',
      row.purchaseOrderId?.poNumber || '—',
      supplierName(row),
      shortDate(row.returnDate),
      row.status,
    ],
  },
  invoices: {
    title: 'Purchase invoices',
    description: 'Three-way match supplier invoices against orders and accepted goods.',
    permission: 'procurement:invoice',
    newHref: '/procurement/invoices/new',
    newLabel: 'New invoice',
    list: procurementApi.listInvoices,
    statuses: ['DRAFT', 'VERIFIED', 'APPROVED', 'PAID', 'CANCELLED'],
    empty: 'No purchase invoices match these filters.',
    headers: ['Invoice', 'Supplier invoice', 'Supplier', 'Invoice date', 'Value', 'Match', 'Status'],
    cells: row => [
      row.invoiceNumber,
      row.supplierInvoiceNumber,
      supplierName(row),
      shortDate(row.invoiceDate),
      money(row.totals?.grandTotal, row.currency),
      row.matchStatus,
      row.status,
    ],
  },
};

export default function DocumentList({ kind }) {
  const config = CONFIG[kind];
  const { can } = useAuthz();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = useCallback(async signal => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const result = await config.list({
        search: deferredSearch,
        status,
        page,
        limit: 25,
      }, { signal });
      setState({
        rows: result.data || [],
        meta: result.meta,
        loading: false,
        error: '',
      });
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return;
      setState(current => ({
        ...current,
        loading: false,
        error: getApiErrorMessage(error, `Unable to load ${config.title.toLowerCase()}.`),
      }));
    }
  }, [config, deferredSearch, page, status]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => setPage(1), [deferredSearch, status]);

  return (
    <div className="space-y-5 flex flex-col gap-3">
      <PageTitle
        eyebrow="Procurement"
        title={config.title}
        description={config.description}
        action={can(config.permission) ? (
          <Link href={config.newHref} className="btn-primary">{config.newLabel}</Link>
        ) : null}
      />

      <div className="grid gap-3 rounded-xl border border-color-100 bg-secondary p-3 sm:grid-cols-[minmax(220px,1fr)_220px_auto]">
        <input
          type="search"
          className={inputClass}
          placeholder="Search document or supplier…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <select className={inputClass} value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {config.statuses.map(value => (
            <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={() => load()} disabled={state.loading}>
          Refresh
        </button>
      </div>

      <ErrorBanner message={state.error} onRetry={() => load()} />

      <div className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
        {state.loading ? (
          <TableSkeleton columns={config.headers.length} />
        ) : state.rows.length === 0 ? (
          <EmptyState title="Nothing to show" description={config.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-primary text-xs uppercase tracking-wide text-primary-text/65">
                <tr>
                  {config.headers.map((header, index) => (
                    <th key={header} className={`px-4 py-3 ${header === 'Value' ? 'text-right' : ''}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-color-100">
                {state.rows.map(row => {
                  const values = config.cells(row);
                  return (
                    <tr key={row._id} className="transition hover:bg-white-100">
                      {values.map((value, index) => {
                        const isStatus = index === values.length - 1 || (kind === 'invoices' && index === values.length - 2);
                        return (
                          <td
                            key={`${row._id}-${config.headers[index]}`}
                            className={`px-4 py-3 ${config.headers[index] === 'Value' ? 'text-right font-medium' : ''}`}
                          >
                            {index === 0 ? (
                              <Link
                                href={`/procurement/${kind}/${row._id}`}
                                className="font-medium text-action hover:underline"
                              >
                                {value}
                              </Link>
                            ) : isStatus ? (
                              <ProcurementStatusBadge value={value} />
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-color-100 px-4 py-3 text-sm">
          <span className="text-secondary-text/60">
            {state.meta?.total
              ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, state.meta.total)} of ${state.meta.total}`
              : '0 records'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={!state.meta?.hasPreviousPage || state.loading}
              onClick={() => setPage(current => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span>Page {state.meta?.page || page} of {Math.max(1, state.meta?.pages || 1)}</span>
            <button
              type="button"
              className="btn-secondary"
              disabled={!state.meta?.hasNextPage || state.loading}
              onClick={() => setPage(current => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
