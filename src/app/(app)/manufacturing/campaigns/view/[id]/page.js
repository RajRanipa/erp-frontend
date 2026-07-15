'use client';
// src/app/manufacturing/campaigns/view/page.js (Campaign Details View)
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Manufacturing from '../../../page';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import NavLink from '@/Components/NavLink';
import { useActiveCampaign } from '../../../ActiveCampaignProvider';
import { formatDateDMY } from '@/utils/date';

// simple helpers
const fmtKg = (n) => {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return '0 kg';
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
};

export default function CampaignDetailsPage() {
  // const { activeCampaign } = useActiveCampaign();
  const { id } = useParams();
  const router = useRouter();


  const campaignId = id || null;
  const [campaign, setCampaign] = useState(id ? id : null);
  const [loading, setLoading] = useState(true);

  // derived
  const hasCampaign = !!campaignId;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!hasCampaign) return;
        // Fresh read from API to avoid stale context values
        console.log('campaignId', campaignId);
        const res = await axiosInstance.get(`/api/campaigns/${campaignId}`);
        if (!mounted) return;
        setCampaign(res?.data?.data || res?.data || null);
        console.log('res', res.data, res.data?.name);
      } catch (e) {
        if (!mounted) return;
        Toast.error(e?.response?.data?.message || 'Failed to load campaign');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campaignId, hasCampaign]);

  const rows = useMemo(() => {
    if (!campaign) return [];
    return [
      { label: 'Campaign Name', value: campaign.name },
      { label: 'Status', value: campaign.status },
      { label: 'Start Date', value: campaign.startDate ? formatDateDMY(campaign.startDate) : '—' },
      { label: 'End Date', value: campaign.endDate ? formatDateDMY(campaign.endDate) : '—' },
      { label: 'Total Raw Issued', value: fmtKg(campaign.totalRawIssued) },
      { label: 'Total Fiber Produced', value: campaign.totalFiberProduced ? fmtKg(campaign.totalFiberProduced) : '—' },
      { label: 'Total Good Fiber Produced', value: campaign?.totalGoodFiberProduced ? fmtKg(campaign?.totalGoodFiberProduced) : '—' },
      { label: 'Total Rejected Fiber Produced', value: campaign?.totalRejectedFiber ? fmtKg(campaign?.totalRejectedFiber) : '—' },
      { label: 'Total Blanket Rolls Produced', value: campaign?.totalBlanketRollsProduced ? (campaign?.totalBlanketRollsProduced) + " rolls" : '0 rolls' },
      // show if present but not required to maintain here
      { label: 'Melt Returns', value: campaign.meltReturns ? fmtKg(campaign.meltReturns) : '—' },
      { label: 'Last Updated', value: campaign.updatedAt ? formatDateDMY(campaign.updatedAt) : '—' },
      { label: 'Created', value: campaign.createdAt ? formatDateDMY(campaign.createdAt) : '—' },
    ];
  }, [campaign]);

  return (
    <Manufacturing>
      <div className="w-full space-y-6">
        <h1 className="lg:text-3xl text-xl font-semibold capitalize mb-5">campaign details</h1>
        {!hasCampaign && (
          <div className="bg-most-secondary p-4 rounded">
            <p className="mb-2">No active campaign selected.</p>
            <p>
              Go to <NavLink href="/manufacturing/campaigns" className="underline">Campaigns</NavLink> and pick one.
            </p>
          </div>
        )}

        {hasCampaign && (
          <div className="bg-most-secondary p-4 rounded-lg shadow-md">
            {loading ? (
              <div>Loading…</div>
            ) : campaign ? (
              <div className="flex gap-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grow">
                  {/* {rows.map((r) => (
                    <div key={r.label} className="flex flex-col">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <span className="text-base font-medium capitalize">{String(r.value ?? '—')}</span>
                    </div>
                  ))} */}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 grow lg:col-span-2'>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Campaign Name</span>
                      <span className="text-base font-medium capitalize">{campaign?.name ?? '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Status</span>
                      <span className="text-base font-medium capitalize">{campaign?.status ?? '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Start Date</span>
                      <span className="text-base font-medium capitalize">{campaign?.startDate ? formatDateDMY(campaign?.startDate) : '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">End Date</span>
                      <span className="text-base font-medium capitalize">{campaign.endDate ? formatDateDMY(campaign.endDate) : '—' }</span>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 grow col-span-2'>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Total Raw Material Issued</span>
                      <span className="text-base font-medium capitalize">{campaign?.totalRawIssued ?? '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-blue-400">Total Fiber Produced</span>
                      <span className="text-base font-medium capitalize text-blue-500">{campaign.totalFiberProduced ? fmtKg(campaign.totalFiberProduced) : '—' }</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-green-400">Total Good Fiber Produced</span>
                      <span className="text-base font-medium capitalize text-green-500">{campaign?.totalGoodFiberProduced ? fmtKg(campaign?.totalGoodFiberProduced) : '—' }</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-red-400">Total Rejected Fiber Produced</span>
                      <span className="text-base font-medium capitalize text-red-500">{campaign?.totalRejectedFiber ? fmtKg(campaign?.totalRejectedFiber) : '—' }</span>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 grow col-span-2'>
                    <div className="flex flex-col">
                      <span className="text-sm text-yellow-400">Total Blanket Rolls Produced</span>
                      <span className="text-base font-medium capitalize text-yellow-500">{campaign?.totalBlanketRollsProduced ?? '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Melt Returns</span>
                      <span className="text-base font-medium capitalize">{campaign.meltReturns ? fmtKg(campaign.meltReturns) : '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Last Updated</span>
                      <span className="text-base font-medium capitalize">{campaign.updatedAt ? formatDateDMY(campaign.updatedAt) : '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white-700">Created</span>
                      <span className="text-base font-medium capitalize">{campaign.createdAt ? formatDateDMY(campaign.createdAt) : '—' }</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 flex-col">
                  <NavLink
                    href={`/manufacturing/campaigns/${campaign._id}/edit/`}
                    type="button"
                    className="bg-primary text-center"
                  >
                    edit campaign
                  </NavLink>
                  <NavLink
                    href={`/manufacturing/batches`}
                    type="button"
                    className="bg-primary text-center"
                  >
                    add batch
                  </NavLink>
                  <NavLink href={`/manufacturing/batches/view`}
                    type="button"
                    className="bg-primary text-center">
                    view batches
                  </NavLink>
                </div>
              </div>
            ) : (
              <div>Campaign not found.</div>
            )}
          </div>
        )}
      </div>
    </Manufacturing>
  );
}