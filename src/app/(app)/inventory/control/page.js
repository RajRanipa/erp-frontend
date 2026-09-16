'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import Table from '@/Components/layout/Table';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const INVENTORY_TABS = [
  { key: 'PACKING', label: 'Blanket stock by packing type' },
  { key: 'LOTS', label: 'Stock by lot' },
  { key: 'TRANSACTIONS', label: 'Recent posted transactions' },
];

export default function InventoryControlPage() {
  const { can } = useAuthz();
  const [summary, setSummary] = useState(null);
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [qualityStatus, setQualityStatus] = useState('');
  const [activeTab, setActiveTab] = useState('PACKING');
  const [loading, setLoading] = useState(true);
  const [rejectingLotId, setRejectingLotId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResponse, stockResponse, transactionResponse] = await Promise.all([
        axiosInstance.get('/api/inventory-v2/summary'),
        axiosInstance.get('/api/inventory-v2/stock', {
          params: {
            search: search.trim() || undefined,
            qualityStatus: qualityStatus || undefined,
            limit: 200,
          },
        }),
        axiosInstance.get('/api/inventory-v2/transactions', { params: { limit: 30 } }),
      ]);
      setSummary(summaryResponse.data);
      setStock(stockResponse.data || []);
      setTransactions(transactionResponse.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load Inventory Control');
    } finally {
      setLoading(false);
    }
  }, [search, qualityStatus]);

  useEffect(() => {
    const timeout = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  const rejectLot = useCallback(async row => {
    const lotId = row.lotId?._id;
    if (!lotId) return;
    const confirmed = globalThis.confirm?.(
      `Mark lot ${row.lotId?.lotNo || lotId} as rejected? This quality downgrade cannot be reversed to accepted stock.`,
    );
    if (!confirmed) return;
    setRejectingLotId(lotId);
    try {
      const idempotencyKey = `reject-lot:${lotId}`;
      const response = await axiosInstance.post(
        `/api/inventory-v2/lots/${lotId}/reject`,
        { note: 'Quality downgraded by authorized inventory user' },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      );
      Toast.success(response?.api?.message || 'Lot moved to rejected stock');
      await load();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to reject inventory lot');
    } finally {
      setRejectingLotId('');
    }
  }, [load]);

  const stockColumns = useMemo(() => [
    {
      key: 'item',
      header: 'Item',
      render: row => (
        <div>
          <div className="font-medium">{row.itemId?.name || '—'}</div>
          <div className="text-xs text-secondary-text">{row.itemId?.sku}</div>
        </div>
      ),
    },
    {
      key: 'lot',
      header: 'Lot',
      render: row => row.lotId?.lotNo || '—',
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: row => `${row.warehouseId?.name || '—'}${row.bin ? ` · ${row.bin}` : ''}`,
    },
    {
      key: 'qualityStatus',
      header: 'Quality',
      render: row => <span className="capitalize">{row.qualityStatus.toLowerCase()}</span>,
    },
    {
      key: 'packing',
      header: 'Packing',
      render: row => row.lotId?.packingLabel || '—',
    },
    {
      key: 'processStatus',
      header: 'Process',
      render: row => (
        <span className="capitalize">{row.processStatus.toLowerCase().replaceAll('_', ' ')}</span>
      ),
    },
    {
      key: 'onHand',
      header: 'On hand',
      align: 'right',
      render: row => `${row.onHand} ${row.baseUom}`,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      render: row => `${row.available} ${row.baseUom}`,
    },
    {
      key: 'catchOnHand',
      header: 'Catch quantity',
      align: 'right',
      render: row => row.catchOnHand === null
        ? '—'
        : `${row.catchOnHand} ${row.catchUom}`,
    },
    {
      key: 'action',
      header: 'Action',
      render: row => can('inventory:adjust') && row.qualityStatus === 'AVAILABLE'
        ? (
          <button
            type="button"
            className="text-red-400 hover:underline disabled:opacity-50"
            disabled={rejectingLotId === row.lotId?._id}
            onClick={() => rejectLot(row)}
          >
            {rejectingLotId === row.lotId?._id ? 'Rejecting…' : 'Mark rejected'}
          </button>
        )
        : '—',
    },
  ], [can, rejectLot, rejectingLotId]);

  const transactionColumns = useMemo(() => [
    { key: 'transactionNo', header: 'Transaction' },
    { key: 'type', header: 'Type' },
    {
      key: 'effectiveAt',
      header: 'Date',
      render: row => new Date(row.effectiveAt).toLocaleString('en-IN'),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: row => [row.referenceType, row.referenceId].filter(Boolean).join(' · ') || '—',
    },
    {
      key: 'entries',
      header: 'Entries',
      render: row => row.entries.map(entry =>
        `${entry.direction} ${entry.quantity} ${entry.baseUom} ${entry.itemId?.name || ''}`
      ).join(' | '),
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      render: row => money.format(Math.max(row.totalValueIn, row.totalValueOut)),
    },
  ], []);

  const packingStock = useMemo(() => {
    const grouped = new Map();
    for (const row of stock) {
      if (row.itemId?.familyId?.code !== 'BLANKET') continue;
      const packingKey = row.lotId?.packingKey || 'UNPACKED';
      const key = [row.itemId?._id, row.warehouseId?._id, packingKey].join(':');
      const current = grouped.get(key) || {
        _id: key,
        item: row.itemId,
        warehouse: row.warehouseId,
        packing: row.lotId?.packingLabel || 'Unpacked',
        onHand: 0,
        available: 0,
        uom: row.baseUom,
      };
      current.onHand += Number(row.onHand || 0);
      current.available += Number(row.available || 0);
      grouped.set(key, current);
    }
    return [...grouped.values()];
  }, [stock]);

  const packingStockColumns = useMemo(() => [
    {
      key: 'item',
      header: 'Blanket Item',
      render: row => `${row.item?.sku || ''} · ${row.item?.name || ''}`,
    },
    { key: 'packing', header: 'Packing Type' },
    { key: 'warehouse', header: 'Warehouse', render: row => row.warehouse?.name || '—' },
    { key: 'onHand', header: 'On hand', align: 'right', render: row => `${row.onHand} ${row.uom}` },
    { key: 'available', header: 'Available', align: 'right', render: row => `${row.available} ${row.uom}` },
  ], []);

  const qualityBuckets = (summary?.stock || []).reduce((totals, row) => ({
    ...totals,
    [row._id?.qualityStatus]:
      (totals[row._id?.qualityStatus] || 0) + Number(row.buckets || 0),
  }), {});

  return (
    <div className="space-y-6 flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold">Inventory Control</h1>
        <p className="mt-0.5 text-sm text-secondary-text">
          Packing-aware quantity control, physical FIFO and moving-average valuation.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Inventory value', money.format(summary?.inventoryValue || 0)],
          ['Stocked items', summary?.stockedItems || 0],
          ['Available stock buckets', qualityBuckets.AVAILABLE || 0],
          ['Hold / rejected buckets', (qualityBuckets.HOLD || 0) + (qualityBuckets.REJECTED || 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white-100 bg-white-50 p-4">
            <div className="text-sm text-secondary-text">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-white-100 bg-white-50 p-1"
        role="tablist"
        aria-label="Inventory views"
      >
        {INVENTORY_TABS.map(tab => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`inventory-panel-${tab.key.toLowerCase()}`}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-primary text-white'
                  : 'text-secondary-text hover:bg-white-100 hover:text-primary-text'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== 'TRANSACTIONS' && (
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
          <CustomInput
            label="Search stock"
            name="inventoryV2Search"
            placeholder="Name, SKU, 96, 1260, size, grade…"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <SelectInput
            label="Quality"
            name="qualityStatus"
            placeholder="All quality statuses"
            value={qualityStatus}
            onChange={event => setQualityStatus(event.target.value)}
            options={[
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'HOLD', label: 'Hold' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </div>
      )}

      {activeTab === 'PACKING' && (
        <section id="inventory-panel-packing" role="tabpanel" className="space-y-3">
        <h2 className="font-semibold">Blanket stock by packing type</h2>
        <p className="text-sm text-secondary-text">
          Blanket quantities grouped by Item, warehouse and current packing type.
        </p>
        <Table
          columns={packingStockColumns}
          data={packingStock}
          rowKey={row => row._id}
          loading={loading}
          pageSize={25}
          emptyMessage="No Blanket packing stock has been posted yet."
        />
        </section>
      )}

      {activeTab === 'LOTS' && (
        <section id="inventory-panel-lots" role="tabpanel" className="space-y-3">
        <h2 className="font-semibold">Stock by lot</h2>
        <p className="text-sm text-secondary-text">
          Detailed lot, quality, process and available-quantity balances.
        </p>
        <Table
          columns={stockColumns}
          data={stock}
          rowKey={row => row._id}
          loading={loading}
          pageSize={25}
          emptyMessage="No V2 stock has been migrated or posted yet."
        />
        </section>
      )}

      {activeTab === 'TRANSACTIONS' && (
      <section id="inventory-panel-transactions" role="tabpanel" className="space-y-3">
        <h2 className="font-semibold">Recent posted transactions</h2>
        <p className="text-sm text-secondary-text">
          Immutable receipt, issue, packing, transfer and adjustment history.
        </p>
        <Table
          columns={transactionColumns}
          data={transactions}
          rowKey={row => row._id}
          loading={loading}
          pageSize={15}
          emptyMessage="No V2 inventory transactions have been posted yet."
        />
      </section>
      )}
    </div>
  );
}
