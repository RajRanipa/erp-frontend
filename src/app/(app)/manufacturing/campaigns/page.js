'use client';

import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import CampaignStatusBadge from '../components/CampaignStatusBadge';
import { formatDate, formatDateTime, formatWeight } from '../lib/formatters';
import { deleteCampaign, getCampaignOverview } from '../lib/manufacturingApi';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'COMPLETED', label: 'Completed' },
];

const STATUS_ORDER = { RUNNING: 0, PLANNED: 1, COMPLETED: 2 };

export default function CampaignListPage() {
  const { can } = useAuthz();
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getCampaignOverview(controller.signal)
      .then(rows => { if (active) setCampaigns(rows); })
      .catch(err => {
        if (active && err?.code !== 'ERR_CANCELED') setError(err?.response?.data?.message || 'Unable to load campaigns');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return [...campaigns]
      .filter(campaign => status === 'ALL' || campaign.status === status)
      .filter(campaign => !query || `${campaign.name} ${campaign.remarks || ''}`.toLowerCase().includes(query))
      .sort((left, right) => {
        const statusDifference = (STATUS_ORDER[left.status] ?? 9) - (STATUS_ORDER[right.status] ?? 9);
        if (statusDifference) return statusDifference;
        return new Date(right.startDate || 0) - new Date(left.startDate || 0);
      });
  }, [campaigns, deferredSearch, status]);

  const handleDelete = async (campaign, triggerElement) => {
    const confirmed = await Toast.promise(`Delete unused campaign ${campaign.name}? Campaigns with production history are protected.`, {
      cancelText: 'Cancel', confirmText: 'Delete', focusTarget: triggerElement,
    });
    if (!confirmed) return;
    try {
      await deleteCampaign(campaign._id);
      setCampaigns(current => current.filter(item => item._id !== campaign._id));
      Toast.success('Campaign deleted');
    } catch (err) {
      Toast.error(err?.response?.data?.message || 'Unable to delete campaign');
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-8 flex flex-col gap-3">
      <header className="flex flex-col gap-4 rounded-2xl border border-color-100 bg-most-secondary p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-action">Campaign register</p>
          <h1 className="mt-2 text-3xl font-semibold">Manufacturing campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white-500">Open a campaign to analyse any production date and shift down to each individual roll.</p>
        </div>
        {can('campaigns:create') ? <Link className="btn-primary inline-flex" href="/manufacturing/campaigns/create">Start Campaign</Link> : null}
      </header>

      <section className="grid gap-3 rounded-xl border border-color-100 bg-most-secondary p-4 md:grid-cols-[1fr_280px]" aria-label="Campaign filters">
        <div>
          <label htmlFor="campaign-search" className="mb-1 block text-sm font-medium text-primary-text">Search campaigns</label>
          <input
            id="campaign-search"
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Campaign name or remarks"
            className="block w-full rounded-lg border border-white-200 bg-transparent px-3 py-2 text-sm text-most-text outline-none focus:border-action focus:ring-3 focus:ring-blue-500/30"
          />
        </div>
        <AdaptiveSelectInput
          name="campaign-status"
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={event => setStatus(event.target.value || 'ALL')}
          parent_className="mb-0"
        />
      </section>

      {error ? <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl border border-color-100 bg-most-secondary">
        <div className="flex items-center justify-between border-b border-white-100 px-5 py-4">
          <div>
            <h2 className="font-semibold">All campaigns</h2>
            <p className="mt-1 text-xs text-white-500">{filteredCampaigns.length} result{filteredCampaigns.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-black-300 text-left text-xs uppercase tracking-wider text-white-500">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Production</th>
                <th className="px-5 py-3">Last record</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-white-500">Loading campaigns…</td></tr>
              ) : filteredCampaigns.length ? filteredCampaigns.map(campaign => (
                <tr key={campaign._id} className="hover:bg-white-100">
                  <td className="px-5 py-4">
                    <Link href={`/manufacturing/campaigns/${campaign._id}`} className="font-semibold text-action hover:underline">{campaign.name}</Link>
                    <p className="mt-1 max-w-sm truncate text-xs text-white-500">{campaign.remarks || 'No remarks'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-white-500">{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</td>
                  <td className="px-5 py-4"><CampaignStatusBadge status={campaign.status} /></td>
                  <td className="px-5 py-4 text-right text-sm">
                    <p className="font-semibold">{Number(campaign.productionSummary?.totalUnits || 0).toLocaleString('en-IN')} units</p>
                    <p className="mt-1 text-xs text-white-500">{formatWeight(campaign.productionSummary?.totalWeightKg)}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-white-500">{formatDateTime(campaign.productionSummary?.lastProductionAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link className="btn-border px-3 py-1 text-sm" href={`/manufacturing/campaigns/${campaign._id}`}>View</Link>
                      {can('campaigns:update') ? <Link className="btn-border px-3 py-1 text-sm" href={`/manufacturing/campaigns/${campaign._id}/edit`}>Edit</Link> : null}
                      {can('campaigns:delete') && campaign.status !== 'RUNNING' ? (
                        <button type="button" className="rounded-lg px-3 py-1 text-sm text-error hover:bg-error/10" onClick={event => handleDelete(campaign, event.currentTarget)}>Delete</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-white-500">No campaigns match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
