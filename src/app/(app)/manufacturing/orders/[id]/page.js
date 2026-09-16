'use client';

import { use, useCallback, useEffect, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import Loading from '@/Components/Loading';
import Table from '@/Components/layout/Table';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';

const requestKey = prefix =>
  `${prefix}:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;

export default function ProductionOrderDetailPage({ params }) {
  const { can } = useAuthz();
  const canUpdate = can('production:update');
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState('');
  const [draw, setDraw] = useState({ quantity: '', lotNo: '' });
  const [inspection, setInspection] = useState({});

  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/manufacturing-v2/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load Production Order');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const post = async (path, body, action) => {
    setBusy(action);
    try {
      const response = await axiosInstance.post(
        `/api/manufacturing-v2/orders/${id}/${path}`,
        body,
        { headers: { 'Idempotency-Key': requestKey(action) } },
      );
      Toast.success(response?.api?.message || 'Production Order updated');
      setOrder(response.data);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to update Production Order');
    } finally {
      setBusy('');
    }
  };

  if (!order) return <Loading variant="skeleton" className="h-64" />;

  const lotColumns = [
    { key: 'lotNo', header: 'Lot' },
    { key: 'processStatus', header: 'Process' },
    { key: 'qualityStatus', header: 'Quality' },
    { key: 'onHandQuantity', header: 'Quantity', align: 'right' },
    {
      key: 'action',
      header: 'Next action',
      render: lot => {
        if (!canUpdate) return 'View only';
        if (lot.processStatus === 'DRAWN') {
          return (
            <SubmitButton
              type="button"
              label="Start drying"
              loading={busy === `dry-${lot._id}`}
              onClick={() => post('board/advance', {
                lotId: lot._id,
                toProcessStatus: 'DRYING',
              }, `dry-${lot._id}`)}
            />
          );
        }
        if (lot.processStatus === 'DRYING') {
          return (
            <SubmitButton
              type="button"
              label="Drying complete"
              loading={busy === `dried-${lot._id}`}
              onClick={() => post('board/advance', {
                lotId: lot._id,
                toProcessStatus: 'DRIED_AWAITING_QC',
              }, `dried-${lot._id}`)}
            />
          );
        }
        if (lot.processStatus === 'DRIED_AWAITING_QC' && lot.qualityStatus === 'HOLD') {
          const values = inspection[lot._id] || { accepted: '', rejected: '' };
          return (
            <div className="flex min-w-[380px] items-start gap-2">
              <CustomInput
                name={`accepted-${lot._id}`}
                placeholder="Accepted"
                type="number"
                min="0"
                step="any"
                value={values.accepted}
                parent_className="mb-0"
                onChange={event => setInspection(current => ({
                  ...current,
                  [lot._id]: { ...values, accepted: event.target.value },
                }))}
              />
              <CustomInput
                name={`rejected-${lot._id}`}
                placeholder="Rejected"
                type="number"
                min="0"
                step="any"
                value={values.rejected}
                parent_className="mb-0"
                onChange={event => setInspection(current => ({
                  ...current,
                  [lot._id]: { ...values, rejected: event.target.value },
                }))}
              />
              <SubmitButton
                type="button"
                label="Post QC"
                loading={busy === `qc-${lot._id}`}
                onClick={() => post('board/inspect', {
                  lotId: lot._id,
                  acceptedQuantity: Number(values.accepted || 0),
                  rejectedQuantity: Number(values.rejected || 0),
                }, `qc-${lot._id}`)}
              />
            </div>
          );
        }
        if (lot.processStatus === 'DRIED_AWAITING_QC') {
          return (
            <SubmitButton
              type="button"
              label="Complete edging"
              loading={busy === `edge-${lot._id}`}
              onClick={() => post('board/advance', {
                lotId: lot._id,
                toProcessStatus: 'EDGED',
              }, `edge-${lot._id}`)}
            />
          );
        }
        if (lot.processStatus === 'EDGED') {
          return (
            <SubmitButton
              type="button"
              label="Pack"
              loading={busy === `pack-${lot._id}`}
              onClick={() => post('board/pack', { lotId: lot._id }, `pack-${lot._id}`)}
            />
          );
        }
        return '—';
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{order.orderNo}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {order.outputItemId?.sku} · {order.outputItemId?.name} · {order.status}
          </p>
        </div>
        {canUpdate && order.status === 'DRAFT' && (
          <SubmitButton
            type="button"
            label="Release & consume raw materials"
            loading={busy === 'release'}
            onClick={() => post('release', {}, 'release')}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Planned', `${order.plannedQuantity} ${order.outputUom}`],
          ['Actual output', `${order.actualOutputQuantity} ${order.outputUom}`],
          ['Rejected', `${order.rejectedQuantity} ${order.outputUom}`],
          ['Material value', `₹${Number(order.materialValue || 0).toLocaleString('en-IN')}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white-100 p-4">
            <div className="text-sm text-secondary-text">{label}</div>
            <div className="mt-2 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="font-semibold">Frozen material requirements</h2>
        <Table
          columns={[
            {
              key: 'item',
              header: 'Item',
              render: row => `${row.itemId?.sku || ''} · ${row.itemId?.name || ''}`,
            },
            { key: 'stage', header: 'Issue stage' },
            {
              key: 'plannedQuantity',
              header: 'Planned',
              align: 'right',
              render: row => `${row.plannedQuantity} ${row.uom}`,
            },
            {
              key: 'issuedQuantity',
              header: 'Issued',
              align: 'right',
              render: row => `${row.issuedQuantity} ${row.uom}`,
            },
          ]}
          data={order.materials || []}
          rowKey={row => String(row.itemId?._id || row.itemId)}
          pagination={false}
        />
      </section>
      {canUpdate && order.status === 'RELEASED' && !(order.outputLotIds || []).length && (
        <form
          className="rounded-xl border border-white-100 p-4"
          onSubmit={event => {
            event.preventDefault();
            post('board/draw', {
              quantity: Number(draw.quantity),
              lotNo: draw.lotNo,
            }, 'draw');
          }}
        >
          <h2 className="mb-3 font-semibold">Record Board draw</h2>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <CustomInput
              label="Drawn quantity"
              name="drawQuantity"
              type="number"
              min="0.000001"
              step="any"
              value={draw.quantity}
              onChange={event => setDraw(current => ({ ...current, quantity: event.target.value }))}
              required
            />
            <CustomInput
              label="Lot number"
              name="drawLotNo"
              value={draw.lotNo}
              placeholder="Defaults from Order"
              onChange={event => setDraw(current => ({ ...current, lotNo: event.target.value }))}
            />
          </div>
          <SubmitButton loading={busy === 'draw'} label="Post Drawn WIP" />
        </form>
      )}
      {(order.outputLotIds || []).length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Board WIP lots</h2>
          <Table
            columns={lotColumns}
            data={order.outputLotIds}
            rowKey={row => row._id}
            pagination={false}
          />
        </section>
      )}
    </div>
  );
}
