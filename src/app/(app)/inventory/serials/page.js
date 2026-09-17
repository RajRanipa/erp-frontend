'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SerialLabels from '../components/SerialLabels';

export default function InventorySerialRegistryPage() {
  const [serials, setSerials] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/inventory-v2/serials', {
        params: { limit: 1000 },
      });
      setSerials(response.data || []);
      setSelected([]);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load serial registry');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return serials;
    return serials.filter(serial => [
      serial.serialNo,
      serial.itemId?.sku,
      serial.itemId?.name,
      serial.lotId?.lotNo,
      serial.campaignId?.name,
    ].some(value => String(value || '').toLowerCase().includes(needle)));
  }, [search, serials]);
  const selectedSet = new Set(selected);
  const labelRows = serials.filter(serial => selectedSet.has(serial.serialNo));

  return (
    <div className="space-y-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Serial Registry</h1>
          <p className="mt-1 text-sm text-secondary-text">
            Search immutable manufacturing records, reopen trace pages and reprint labels.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
          disabled={!selected.length}
          onClick={() => setPrinting(true)}
        >
          Print selected ({selected.length})
        </button>
      </div>
      {printing && labelRows.length > 0 && (
        <SerialLabels serials={labelRows} onClose={() => setPrinting(false)} />
      )}
      <div className="rounded-xl ">
        <input
          className="rounded-lg border border-white-100 bg-transparent px-3 py-2 w-[350px]"
          value={search}
          placeholder="Search serial, SKU, product, lot or campaign"
          onChange={event => setSearch(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-white-100">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white-100 text-secondary-text">
            <tr>
              <th className="p-3">Print</th>
              <th className="p-3">Serial</th>
              <th className="p-3">Product</th>
              <th className="p-3">Lot / campaign</th>
              <th className="p-3">Weight</th>
              <th className="p-3">Manufactured</th>
              <th className="p-3">Trace</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(serial => (
              <tr key={serial._id} className="border-b border-white-100 last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(serial.serialNo)}
                    onChange={() => setSelected(current => selectedSet.has(serial.serialNo)
                      ? current.filter(value => value !== serial.serialNo)
                      : [...current, serial.serialNo])}
                  />
                </td>
                <td className="p-3 font-mono">{serial.serialNo}</td>
                <td className="p-3">
                  <p>{serial.itemId?.name}</p>
                  <p className="text-xs text-secondary-text">{serial.itemId?.sku}</p>
                </td>
                <td className="p-3">
                  <p>{serial.lotId?.lotNo}</p>
                  <p className="text-xs text-secondary-text">{serial.campaignId?.name || '—'}</p>
                </td>
                <td className="p-3">{serial.catchQuantity ?? '—'} {serial.catchUom || ''}</td>
                <td className="p-3">{serial.manufacturedAt ? new Date(serial.manufacturedAt).toLocaleString() : '—'}</td>
                <td className="p-3">
                  <a className="text-blue-500 hover:underline" href={`/trace/${serial.serialNo}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr><td colSpan="7" className="p-8 text-center text-secondary-text">No serials match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {serials.length >= 1000 && (
        <p className="text-sm text-amber-400">Showing the first 1,000 records. Use search to narrow the list.</p>
      )}
    </div>
  );
}
