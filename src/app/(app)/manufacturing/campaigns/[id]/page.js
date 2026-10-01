'use client';

import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import BaseDatePicker from '@/Components/inputs/BaseDatePicker';
import Table from '@/Components/layout/Table';
import useAuthz from '@/hooks/useAuthz';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import CampaignStatusBadge from '../../components/CampaignStatusBadge';
import { formatDate, formatDateTime, formatDateTimeParts, formatWeight, specificationText, todayInIndia } from '../../lib/formatters';
import {
  getAllCampaignProductionRecords,
  getCampaignProductionReport,
} from '../../lib/manufacturingApi';

const SHIFT_OPTIONS = [
  { value: 'DAY', label: 'Day · 07:30 AM–07:30 PM' },
  { value: 'NIGHT', label: 'Night · 07:30 PM–07:30 AM' },
];

const QUALITY_OPTIONS = [
  { value: 'ALL', label: 'All quality statuses' },
  { value: 'OK', label: 'Accepted only' },
  { value: 'REJECTED', label: 'Rejected only' },
];

function SummaryCard({ label, value, detail, accent = '' }) {
  return (
    <article className="rounded-xl border border-color-100 bg-most-secondary/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-white-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-white-500">{detail}</p>
    </article>
  );
}

function QualityBadge({ accepted }) {
  return accepted ? (
    <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">Accepted</span>
  ) : (
    <span className="inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400">Rejected</span>
  );
}

function InventoryBadge({ status }) {
  const styles = status === 'POSTED'
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
    : status === 'NOT_APPLICABLE'
      ? 'border-white-200 bg-white-100 text-white-500'
      : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${styles}`}>{String(status || 'PENDING').replaceAll('_', ' ')}</span>;
}

function ItemIdentity({ record }) {
  return (
    <div>
      <p className="font-medium">{record.item?.name || 'Unmapped product'}</p>
      <p className="text-xs text-white-500">{record.family?.name || 'Unknown family'}</p>
      <p className="text-xs text-white-500">{record.item?.sku || 'UNMAPPED'}</p>
    </div>
  );
}

const PRODUCTION_COLUMNS = [
  {
    key: 'manufactured_at',
    header: 'Manufactured at',
    className: 'px-4 py-3 text-sm',
    render: row => formatDateTimeParts(row.at),
  },
  {
    key: 'item',
    header: 'Item',
    className: 'px-4 py-3',
    render: row => <ItemIdentity record={row} />,
  },
  {
    key: 'specification',
    header: 'Specification',
    className: 'max-w-sm px-4 py-3 text-sm text-white-700',
    render: row => specificationText(row),
  },
  {
    key: 'serial_no',
    header: 'Serial no.',
    className: 'px-4 py-3 font-mono text-sm',
    render: row => row.serialNo
      ? <Link className="text-blue-400 hover:underline" href={`/trace/${row.serialNo}`}>{row.serialNo}</Link>
      : '—',
  },
  {
    key: 'weight',
    header: 'Weight',
    className: 'whitespace-nowrap px-4 py-3 text-right font-semibold',
    render: row => formatWeight(row.weightKg),
  },
  {
    key: 'quality',
    header: 'Quality',
    className: 'px-4 py-3',
    render: row => <QualityBadge accepted={row.statusOk} />,
  },
  {
    key: 'source',
    header: 'Source',
    className: 'px-4 py-3 text-sm text-white-500',
    render: row => (
      <div>
        <p>{row.gatewayId} · Scale {row.scaleNo}</p>
        <p className="mt-1 text-xs">{row.recordId}</p>
      </div>
    ),
  },
  {
    key: 'inventory',
    header: 'Inventory',
    className: 'px-4 py-3',
    render: row => (
      <div className="flex flex-col items-start">
        <InventoryBadge status={row.inventoryStatus} />
        {row.inventoryLastError ? (
          <p className="mt-2 max-w-xs text-xs text-error">{row.inventoryLastError}</p>
        ) : null}
      </div>
    ),
  },
];

const productionRowKey = row => row._id;

export default function CampaignReportPage() {
  const { id } = useParams();
  const { can } = useAuthz();
  const [filters, setFilters] = useState(() => ({
    date: todayInIndia(),
    shift: 'DAY',
    quality: 'ALL',
    familyId: '',
  }));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [individualReport, setIndividualReport] = useState(null);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [individualError, setIndividualError] = useState('');
  const individualRequestRef = useRef(null);

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');
    getCampaignProductionReport(id, filters, controller.signal)
      .then(data => { if (active) setReport(data); })
      .catch(err => {
        if (active && err?.code !== 'ERR_CANCELED') setError(err?.response?.data?.message || 'Unable to load this production report');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, filters]);

  useEffect(() => () => individualRequestRef.current?.abort(), []);

  const familyOptions = useMemo(() => [
    { value: 'ALL', label: 'All product families' },
    ...(report?.filterOptions?.families || []).map(family => ({
      value: String(family._id),
      label: family.code ? `${family.name} · ${family.code}` : family.name,
    })),
  ], [report?.filterOptions?.families]);

  const updateFilter = (name, value) => {
    individualRequestRef.current?.abort();
    individualRequestRef.current = null;
    setIndividualReport(null);
    setIndividualError('');
    setIndividualLoading(false);
    setFilters(current => ({
      ...current,
      ...(['date', 'shift'].includes(name) ? { familyId: '' } : {}),
      [name]: value === 'ALL' && name === 'familyId' ? '' : value,
    }));
  };

  const campaign = report?.campaign;
  const summary = report?.summary || {};
  const individualRecords = individualReport?.records || [];
  const individualPagination = individualReport?.pagination || {
    total: individualRecords.length,
  };
  const individualRequested = individualLoading || Boolean(individualReport) || Boolean(individualError);

  const loadIndividualRecords = async () => {
    individualRequestRef.current?.abort();
    const controller = new AbortController();
    individualRequestRef.current = controller;
    setIndividualLoading(true);
    setIndividualError('');

    try {
      const data = await getAllCampaignProductionRecords(
        id,
        filters,
        controller.signal,
      );
      if (individualRequestRef.current === controller) {
        setIndividualReport(data);
      }
    } catch (err) {
      if (individualRequestRef.current === controller && err?.code !== 'ERR_CANCELED') {
        setIndividualError(
          err?.response?.data?.message || 'Unable to load individual production records',
        );
      }
    } finally {
      if (individualRequestRef.current === controller) {
        individualRequestRef.current = null;
        setIndividualLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1800px] space-y-5 pb-10 flex flex-col gap-3">
      <header className="overflow-hidden rounded-2xl border border-color-100 bg-secondary">
        <div className="flex flex-col gap-5 border-b border-white-100 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-action">Campaign production intelligence</p>
              {campaign ? <CampaignStatusBadge status={campaign.status} /> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{campaign?.name || (loading ? 'Loading campaign…' : 'Campaign')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white-500">{campaign?.remarks || 'Manufacturing output, quality and traceability for this campaign.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-border" href="/manufacturing/campaigns">All campaigns</Link>
            {can('campaigns:update') && campaign ? <Link className="btn-primary" href={`/manufacturing/campaigns/${campaign._id}/edit`}>Edit campaign</Link> : null}
          </div>
        </div>
      </header>

      <section className="rounded-2xl">
        <dl className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            [{ key: 'Start date', class: 'from-amber-500/20 to-amber-500/5' }, formatDate(campaign?.startDate)],
            [{ key: 'End date', class: 'from-yellow-500/20 to-yellow-500/5' }, formatDate(campaign?.endDate)],
            [{ key: 'Total rolls', class: 'dark:from-indigo-500/20 dark:to-indigo-500/5 from-indigo-700/30 to-indigo-700/5' }, Number(campaign?.totalBlanketRollsProduced || 0).toLocaleString('en-IN')],
            [{ key: 'Good fibre', class: 'dark:from-emerald-500/20 dark:to-emerald-500/5 from-emerald-600/30 to-emerald-600/5' }, formatWeight(campaign?.totalGoodFiberProduced)],
            [{ key: 'Rejected fibre', class: 'dark:from-red-500/20 dark:to-red-500/5 from-red-600/30 to-red-600/5' }, formatWeight(campaign?.totalRejectedFiber)],
          ].map(([label, value]) => (
            <div key={label.key} className={cn(label.class, 'p-4 rounded-2xl border-0 bg-gradient-to-br')}>
              <dt className="text-xs uppercase tracking-wider text-white-500">{label.key}</dt>
              <dd className="mt-2 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-color-100 bg-most-secondary/50 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Shift report filters</h2>
          <p className="mt-1 text-sm text-white-500">Day: selected date 07:30 AM–07:30 PM. Night: selected date 07:30 PM–next date 07:30 AM (IST).</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="production-date" className="mb-1 block text-sm font-medium text-primary-text">Production date</label>
            <BaseDatePicker id="production-date" name="date" value={filters.date} onChange={value => updateFilter('date', value)} />
          </div>
          <AdaptiveSelectInput name="shift" label="Shift" value={filters.shift} options={SHIFT_OPTIONS} onChange={event => updateFilter('shift', event.target.value || 'DAY')} parent_className="mb-0" />
          <AdaptiveSelectInput name="quality" label="Quality" value={filters.quality} options={QUALITY_OPTIONS} onChange={event => updateFilter('quality', event.target.value || 'ALL')} parent_className="mb-0" />
          <AdaptiveSelectInput name="familyId" label="Product family" value={filters.familyId || 'ALL'} options={familyOptions} onChange={event => updateFilter('familyId', event.target.value || 'ALL')} parent_className="mb-0" />
        </div>
        {report?.range ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-action/30 bg-action/10 px-4 py-3 text-sm">
            <span className="font-medium">{report.range.shift === 'DAY' ? 'Day shift' : 'Night shift'} report</span>
            <span className="text-white-500">{formatDateTime(report.range.startIST)} → {formatDateTime(report.range.endIST)} · IST</span>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
          <p className="font-semibold">Report could not be loaded</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Filtered production summary">
        <SummaryCard label="Total output" value={loading ? '…' : `${Number(summary.totalUnits || 0).toLocaleString('en-IN')} units`} detail={formatWeight(summary.totalWeightKg)} accent="text-action" />
        <SummaryCard label="Accepted" value={loading ? '…' : `${Number(summary.acceptedUnits || 0).toLocaleString('en-IN')} units`} detail={formatWeight(summary.acceptedWeightKg)} accent="text-emerald-400" />
        <SummaryCard label="Rejected" value={loading ? '…' : `${Number(summary.rejectedUnits || 0).toLocaleString('en-IN')} units`} detail={formatWeight(summary.rejectedWeightKg)} accent="text-red-400" />
        <SummaryCard label="Acceptance rate" value={loading ? '…' : `${Number(summary.acceptanceRate || 0).toFixed(2)}%`} detail={`Average ${formatWeight(summary.averageWeightKg)}`} />
        <SummaryCard label="Traceability" value={loading ? '…' : `${Number(summary.serializedUnits || 0).toLocaleString('en-IN')} serialized`} detail={`${Number(summary.unmappedUnits || 0).toLocaleString('en-IN')} unmapped records`} />
      </section>

      <section className="rounded-2xl border border-color-100 bg-most-secondary">
        <div className="border-b border-white-100 px-5 py-4">
          <h2 className="text-lg font-semibold">Production summary</h2>
          <p className="mt-1 text-sm text-white-500">Grouped in the same operational shape used for daily email and WhatsApp reporting.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-black-300 text-left text-xs uppercase tracking-wider text-white-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Specification</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white-100">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-white-500">Building shift summary…</td></tr>
              ) : report?.grouped?.length ? report.grouped.map(group => (
                <tr key={`${group.item?._id || 'unmapped'}-${group.productCode}-${group.statusOk}-${group.temperatureValue}-${group.densityValue}-${group.sizeCode}`} className="hover:bg-white-100">
                  <td className="px-4 py-3"><ItemIdentity record={group} /></td>
                  <td className="px-4 py-3 text-sm text-white-700">{specificationText(group)}</td>
                  <td className="px-4 py-3"><QualityBadge accepted={group.statusOk} /></td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(group.totalRolls || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatWeight(group.totalWeight)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-white-500">No production was recorded for this shift and filter selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-color-100 bg-most-secondary">
        <div className="flex flex-col gap-3 border-b border-white-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Individual production records</h2>
            <p className="mt-1 text-sm text-white-500">
              Load the exact PLC records for the selected date, shift, quality and product family only when you need them.
            </p>
          </div>
          {individualReport ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-white-500">
                {Number(individualPagination.total || 0).toLocaleString('en-IN')} records loaded
              </p>
              <button
                type="button"
                className="btn-border"
                disabled={individualLoading}
                onClick={loadIndividualRecords}
              >
                Refresh records
              </button>
            </div>
          ) : null}
        </div>
        {!individualRequested ? (
          <div className="flex flex-col items-start gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                {Number(summary.totalUnits || 0).toLocaleString('en-IN')} individual records match the current report.
              </p>
              <p className="mt-1 text-sm text-white-500">
                The summary API stays fast because these detailed rows are fetched separately.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={loading || Number(summary.totalUnits || 0) === 0}
              onClick={loadIndividualRecords}
            >
              View all individual records
            </button>
          </div>
        ) : (
          <div className="p-3">
            {individualError ? (
              <div className="mb-3 flex flex-col gap-3 rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between">
                <span>{individualError}</span>
                <button type="button" className="btn-border" onClick={loadIndividualRecords}>
                  Try again
                </button>
              </div>
            ) : null}
            <Table
              columns={PRODUCTION_COLUMNS}
              data={individualRecords}
              rowKey={productionRowKey}
              loading={individualLoading}
              pageSize={25}
              emptyMessage="No individual records match this selection."
            />
          </div>
        )}
      </section>
    </div>
  );
}
