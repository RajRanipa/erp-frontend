'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';
import ProcurementStatusBadge from './components/ProcurementStatusBadge';
import {
  EmptyState,
  ErrorBanner,
  MetricCard,
  PageTitle,
  TableSkeleton,
} from './components/ProcurementUI';
import {
  money,
  procurementApi,
  shortDate,
  supplierName,
} from './lib/procurementApi';

export default function ProcurementOverviewPage() {
  const { can } = useAuthz();
  const [state, setState] = useState({
    summary: null,
    orders: [],
    loading: true,
    error: '',
  });

  const load = useCallback(async signal => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const [summary, orders] = await Promise.all([
        procurementApi.summary({ signal }),
        procurementApi.listOrders({ limit: 8 }, { signal }),
      ]);
      setState({
        summary: summary.data,
        orders: orders.data || [],
        loading: false,
        error: '',
      });
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return;
      setState(current => ({
        ...current,
        loading: false,
        error: getApiErrorMessage(error, 'Unable to load procurement overview.'),
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const summary = state.summary || {};
  const pending = summary.orders?.PENDING_APPROVAL?.count || 0;
  const openOrders = (summary.orders?.APPROVED?.count || 0)
    + (summary.orders?.PARTIALLY_RECEIVED?.count || 0);

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Purchase-to-pay"
        title="Procurement command center"
        description="Control supplier orders, goods acceptance, returns, and invoice matching from one workflow."
        action={can('procurement:create') ? (
          <Link href="/procurement/orders/new" className="btn-primary">
            Create purchase order
          </Link>
        ) : null}
      />

      <ErrorBanner message={state.error} onRetry={() => load()} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Awaiting approval"
          value={pending}
          detail="Purchase orders requiring a decision"
          tone="amber"
          loading={state.loading}
        />
        <MetricCard
          label="Open orders"
          value={openOrders}
          detail={money(summary.openOrderValue)}
          tone="blue"
          loading={state.loading}
        />
        <MetricCard
          label="Overdue deliveries"
          value={summary.overdueOrders || 0}
          detail="Past expected delivery date"
          tone="red"
          loading={state.loading}
        />
        <MetricCard
          label="Invoice exceptions"
          value={summary.invoiceVariances || 0}
          detail={`${summary.overdueInvoices || 0} overdue invoice(s)`}
          tone="violet"
          loading={state.loading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="overflow-hidden rounded-xl border border-color-100 bg-secondary">
          <div className="flex items-center justify-between border-b border-color-100 px-4 py-3">
            <div>
              <h2 className="font-medium text-secondary-text">Recent purchase orders</h2>
              <p className="text-xs text-secondary-text/55">Latest commercial commitments</p>
            </div>
            <Link href="/procurement/orders" className="text-sm font-medium text-action hover:underline">
              View all
            </Link>
          </div>
          {state.loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : state.orders.length === 0 ? (
            <EmptyState
              title="No purchase orders yet"
              description="Create the first order to begin a controlled procurement workflow."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-primary text-xs uppercase tracking-wide text-primary-text/65">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Order date</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-color-100">
                  {state.orders.map(order => (
                    <tr key={order._id} className="transition hover:bg-white-100">
                      <td className="px-4 py-3">
                        <Link
                          href={`/procurement/orders/${order._id}`}
                          className="font-medium text-action hover:underline"
                        >
                          {order.poNumber}
                        </Link>
                      </td>
                      <td className="max-w-64 truncate px-4 py-3">{supplierName(order)}</td>
                      <td className="px-4 py-3 text-secondary-text/70">{shortDate(order.orderDate)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {money(order.totals?.grandTotal, order.currency)}
                      </td>
                      <td className="px-4 py-3"><ProcurementStatusBadge value={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-color-100 bg-secondary p-4">
          <h2 className="font-medium text-secondary-text">Quick workflow</h2>
          <p className="mt-1 text-xs text-secondary-text/55">
            Every posting is auditable and inventory-safe.
          </p>
          <div className="mt-4 space-y-2">
            {[
              ['01', 'Create & submit PO', '/procurement/orders/new', 'procurement:create'],
              ['02', 'Receive supplier goods', '/procurement/receipts/new', 'procurement:receive'],
              ['03', 'Process a return', '/procurement/returns/new', 'procurement:return'],
              ['04', 'Match supplier invoice', '/procurement/invoices/new', 'procurement:invoice'],
            ].filter(([, , , permission]) => can(permission)).map(([number, label, href]) => (
              <Link
                key={number}
                href={href}
                className="flex items-center gap-3 rounded-lg border border-color-100 p-3 transition hover:border-action/50 hover:bg-action/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-action/10 text-xs font-semibold text-action">
                  {number}
                </span>
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-auto text-secondary-text/45">→</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
