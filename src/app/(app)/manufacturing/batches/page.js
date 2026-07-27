// src/app/manufacturing/batches/view/page.js
'use client';
import { useEffect, useState } from 'react';
import { axiosInstance, getApiErrorMessage } from '@/lib/axiosInstance';
import { formatDateDMY } from '@/utils/date';
import NavLink from '@/Components/NavLink';
import { Toast } from '@/Components/toast';

export default function BatchesMain() {
  // const { activeCampaign } = useActiveCampaign();
  const [activeCampaign, setActiveCampaign] = useState({
    _id: null,
    name: null,
    status: null,
  });

  const campaignId = activeCampaign?._id || null;
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    active();
  }, [])
  const active = async () => {
    try {
      const { data } = await axiosInstance.get('/api/campaigns/active');
      setActiveCampaign(data[0]);
    } catch (e) {
      Toast.error(getApiErrorMessage(e, 'Failed to load the active campaign.'));
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!campaignId) {
          setBatches([]);
          return;
        }
        const res = await axiosInstance.get('/api/batches', { params: { campaign: campaignId } });
        if (!mounted) return;
        const data = res?.data?.data ?? res?.data ?? [];
        setBatches(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        Toast.error(e?.response?.data?.message || 'Failed to load batches');
        setBatches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campaignId]);



  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-semibold">View Batches for {activeCampaign?.name} </h1>
      </div>

      {!campaignId && (
        <div className="bg-most-secondary p-4 rounded">
          <p className="mb-1">No active campaign selected.</p>
          <p>
            Go to <NavLink href="/manufacturing/campaigns" className="underline">Campaigns</NavLink> and pick one.
          </p>
        </div>
      )}

      {campaignId && (
        <div className="bg-most-secondary p-4 rounded-lg shadow-md">
          {loading ? (
            <div>Loading…</div>
          ) : batches.length === 0 ? (
            <div className="text-center">
              <p className="mb-2">No batches found for this campaign.</p>
              <NavLink href={`/manufacturing/batches/new?campaign=${campaignId}`} className="underline">Create a batch</NavLink>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-color-300">
                    <th className="py-2 pr-4">No. Of Batches</th>
                    <th className="py-2 pr-4">Date</th>
                    {/* <th className="py-2 pr-4">Warehouse</th> */}
                    <th className="py-2 pr-4">Raw Materials</th>
                    <th className="py-2 pr-4">Batch ID</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b._id} className="border-b border-color-300 hover:bg-muted/30">
                      <td className="py-2 pr-4">{b.numbersBatches ?? '—'}</td>
                      <td className="py-2 pr-4">{b.date ? formatDateDMY(b.date, true) : '—'}</td>
                      {/* <td className="py-2 pr-4">
                        {b.warehouseId?.name || '—'}
                      </td> */}
                      <td className="py-2 pr-4">
                        {Array.isArray(b.rawMaterials) && b.rawMaterials.length > 0 ? (
                          <ul className="list-disc ml-5">
                            {b.rawMaterials.map((rm, idx) => (
                              <li key={idx} className="capitalize">
                                {rm?.itemId && typeof rm.itemId === 'object'
                                  ? (rm.itemId.name ?? rm.itemId._id ?? '')
                                  : String(rm?.itemId ?? '')}
                                {` — ${rm?.weight ?? ''}${rm?.unit ? ` ${rm.unit}` : ''}`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium">{b.batche_id}</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
