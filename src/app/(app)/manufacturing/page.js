'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CampaignStatusBadge from './components/CampaignStatusBadge';
import { formatDate, formatDateTime, formatWeight } from './lib/formatters';
import { getCampaignOverview } from './lib/manufacturingApi';

const WORKSPACES = [
  {
    href: '/manufacturing/campaigns',
    title: 'Campaigns & production',
    description: 'Review shift output, quality, specifications and individual rolls.',
    permissionHint: 'Campaign control',
  },
  {
    href: '/manufacturing/orders',
    title: 'Production Orders',
    description: 'Plan output and track material issues against production.',
    permissionHint: 'Planning',
  },
  {
    href: '/manufacturing/recipes',
    title: 'Manufacturing Recipes',
    description: 'Maintain approved recipes and material requirements.',
    permissionHint: 'Process master',
  },
  {
    href: '/manufacturing/chopping',
    title: 'Chopping Batch',
    description: 'Run and record the existing chopping workflow.',
    permissionHint: 'Shop floor',
  },
];

function MetricCard({ label, value, detail, accent = '' }) {
  return (
    <article className="rounded-xl border border-color-100 bg-most-secondary/40 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-sm text-white-500">{detail}</p>
    </article>
  );
}

export default function ManufacturingDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getCampaignOverview(controller.signal)
      .then(rows => { if (active) setCampaigns(rows); })
      .catch(err => {
        if (active && err?.code !== 'ERR_CANCELED') setError(err?.response?.data?.message || 'Unable to load manufacturing overview');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const overview = useMemo(() => campaigns.reduce((value, campaign) => {
    const summary = campaign.productionSummary || {};
    value.totalUnits += Number(summary.totalUnits || 0);
    value.totalWeightKg += Number(summary.totalWeightKg || 0);
    value.acceptedUnits += Number(summary.acceptedUnits || 0);
    value.rejectedUnits += Number(summary.rejectedUnits || 0);
    if (campaign.status === 'RUNNING') value.running += 1;
    return value;
  }, { totalUnits: 0, totalWeightKg: 0, acceptedUnits: 0, rejectedUnits: 0, running: 0 }), [campaigns]);

  const runningCampaign = campaigns.find(campaign => campaign.status === 'RUNNING');
  const recentCampaigns = [...campaigns]
    .sort((left, right) => new Date(right.startDate || 0) - new Date(left.startDate || 0))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8 flex flex-col gap-3">
      <section className="overflow-hidden rounded-2xl border border-color-200 bg-most-secondary/50 shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-action">Manufacturing command centre</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Production, quality and traceability in one place</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white-500 md:text-base">
              Follow campaign progress, inspect every PLC production record and move into planning or recipes without losing manufacturing context.
            </p>
          </div>
          <div className="rounded-xl border border-color-100 bg-most p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white-500">Current campaign</p>
                <h2 className="mt-2 text-xl font-semibold">{runningCampaign?.name || 'No running campaign'}</h2>
              </div>
              {runningCampaign ? <CampaignStatusBadge status={runningCampaign.status} /> : null}
            </div>
            {runningCampaign ? (
              <>
                <p className="mt-4 text-sm text-white-500">Started {formatDate(runningCampaign.startDate)}</p>
                <p className="mt-1 text-sm text-white-500">Last production {formatDateTime(runningCampaign.productionSummary?.lastProductionAt)}</p>
                <Link className="btn-primary mt-5 inline-flex" href={`/manufacturing/campaigns/${runningCampaign._id}`}>
                  Open live campaign
                </Link>
              </>
            ) : (
              <Link className="btn-primary mt-5 inline-flex" href="/manufacturing/campaigns/create">Start a campaign</Link>
            )}
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Manufacturing totals">
        <MetricCard label="Campaigns" value={loading ? '…' : campaigns.length} detail={`${overview.running} currently running`} />
        <MetricCard label="Produced units" value={loading ? '…' : overview.totalUnits.toLocaleString('en-IN')} detail={formatWeight(overview.totalWeightKg)} accent="text-action" />
        <MetricCard label="Accepted" value={loading ? '…' : overview.acceptedUnits.toLocaleString('en-IN')} detail="Quality accepted records" accent="text-emerald-400" />
        <MetricCard label="Rejected" value={loading ? '…' : overview.rejectedUnits.toLocaleString('en-IN')} detail="Quality rejected records" accent="text-red-400" />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Manufacturing workspaces</h2>
            <p className="mt-1 text-sm text-white-500">Choose the workflow you need.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WORKSPACES.map(workspace => (
            <Link key={workspace.href} href={workspace.href} className="group rounded-xl border border-color-100 bg-most-secondary/30 p-5 transition hover:-translate-y-0.5 hover:border-action/60 hover:shadow-lg">
              <p className="text-xs uppercase tracking-widest text-white-500">{workspace.permissionHint}</p>
              <h3 className="mt-3 text-lg font-semibold group-hover:text-action">{workspace.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white-500">{workspace.description}</p>
              <span className="mt-5 inline-flex text-sm font-medium text-action">Open workspace →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-color-100 bg-most-secondary/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent campaigns</h2>
            <p className="mt-1 text-sm text-white-500">Latest campaign activity and output.</p>
          </div>
          <Link href="/manufacturing/campaigns" className="btn-border">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-white-100">
          {recentCampaigns.length ? recentCampaigns.map(campaign => (
            <Link key={campaign._id} href={`/manufacturing/campaigns/${campaign._id}`} className="grid gap-3 py-4 transition hover:bg-white-100 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] md:items-center md:px-3">
              <div>
                <p className="font-semibold">{campaign.name}</p>
                <p className="mt-1 text-xs text-white-500">{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</p>
              </div>
              <CampaignStatusBadge status={campaign.status} />
              <p className="text-sm"><span className="font-semibold">{campaign.productionSummary?.totalUnits || 0}</span> units</p>
              <p className="text-sm text-white-500">{formatWeight(campaign.productionSummary?.totalWeightKg)}</p>
            </Link>
          )) : (
            <p className="py-10 text-center text-sm text-white-500">No campaigns have been created yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
