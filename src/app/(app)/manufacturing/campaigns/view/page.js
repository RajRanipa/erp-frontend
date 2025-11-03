'use client';
// src/app/manufacturing/campaigns/view/page.js (Campaign Details View)
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Manufacturing from '../../page';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import NavLink from '@/Components/NavLink';
import { useActiveCampaign } from '../../ActiveCampaignProvider';
import { formatDateDMY } from '@/utils/date';

// simple helpers
const fmtKg = (n) => {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return '0 kg';
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
};

export default function CampaignDetailsPage() {
  const { activeCampaign } = useActiveCampaign();
  const router = useRouter();
  

  const campaignId = activeCampaign?._id || null;

  const [campaign, setCampaign] = useState(null);
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
        const res = await axiosInstance.get(`/api/campaigns/${campaignId}`);
        if (!mounted) return;
        setCampaign(res?.data?.data || res?.data || null);
      } catch (e) {
        if (!mounted) return;
        Toast.error( e?.response?.data?.message || 'Failed to load campaign');
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
      // show if present but not required to maintain here
      ...(campaign?.meltReturns != null ? [{ label: 'Melt Returns', value: fmtKg(campaign.meltReturns) }] : []),
      ...(campaign?.totalFiberProduced != null ? [{ label: 'Total Fiber Produced', value: fmtKg(campaign.totalFiberProduced) }] : []),
      { label: 'Last Updated', value: campaign.updatedAt ? formatDateDMY(campaign.updatedAt) : '—' },
      { label: 'Created', value: campaign.createdAt ? formatDateDMY(campaign.createdAt) : '—' },
    ];
  }, [campaign]);

  return (
    <Manufacturing>
      <div className="w-full space-y-6">
          <h1 className="text-3xl font-semibold capitalize mb-5">campaign details</h1>
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
                  {rows.map((r) => (
                    <div key={r.label} className="flex flex-col">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <span className="text-base font-medium capitalize">{String(r.value ?? '—')}</span>
                    </div>
                  ))}
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