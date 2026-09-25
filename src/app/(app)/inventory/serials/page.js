'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SerialLabels from '../components/SerialLabels';
import DateInput from '@/Components/inputs/DateInput';
import CustomInput from '@/Components/inputs/CustomInput';

export default function InventorySerialRegistryPage() {
  const [serials, setSerials] = useState([]);
  const [search, setSearch] = useState('');
  const [searchByDate, setSearchByDate] = useState('');
  const [selected, setSelected] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Keep track of search queries already resolved on the server to prevent redundant calls
  const executedServerQueries = useRef(new Set());

  // Initial load
  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/inventory/serials', {
        params: { limit: 1000 },
      });
      setSerials(response.data || []);
      setSelected([]);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load serial registry');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 1. Local Filtering Logic
  const visible = useMemo(() => {
    const rawTokens = [
      ...search.trim().toLowerCase().split(/\s+/),
      searchByDate ? String(searchByDate).trim() : '',
    ].filter(Boolean);

    if (rawTokens.length === 0) return serials;

    return serials.filter(serial => {
      const manufactured = serial.manufacturedAt
        ? new Date(serial.manufacturedAt).toISOString().slice(0, 10)
        : '';
      const manufacturedLocale = serial.manufacturedAt
        ? new Date(serial.manufacturedAt).toLocaleString().toLowerCase()
        : '';

      const searchableText = [
        serial.serialNo,
        serial.itemId?.sku,
        serial.itemId?.name,
        serial.lotId?.lotNo,
        serial.campaignId?.name,
        manufactured,
        manufacturedLocale,
      ]
        .map(v => String(v || '').toLowerCase())
        .join(' ');

      return rawTokens.every(token => searchableText.includes(token));
    });
  }, [search, searchByDate, serials]);

  // 2. Fallback to API if local count < 5
  useEffect(() => {
    const trimmedSearch = search.trim();
    const queryKey = `${trimmedSearch}__${searchByDate || ''}`;

    // If query is empty or we already searched this exact term on the server, skip
    if ((!trimmedSearch && !searchByDate) || executedServerQueries.current.has(queryKey)) {
      return;
    }

    // Trigger API only if local matches are fewer than 5
    if (visible.length < 5) {
      const timer = setTimeout(async () => {
        try {
          setIsSearchingServer(true);
          const response = await axiosInstance.get('/api/inventory/serials', {
            params: {
              search: trimmedSearch || undefined,
              date: searchByDate || undefined,
              limit: 50,
            },
          });

          const serverResults = response.data || [];
          executedServerQueries.current.add(queryKey);

          if (serverResults.length > 0) {
            setSerials(prev => {
              // Merge results avoiding duplicate records
              const existingIds = new Set(prev.map(item => item._id || item.serialNo));
              const freshItems = serverResults.filter(
                item => !existingIds.has(item._id || item.serialNo)
              );
              return [...prev, ...freshItems];
            });
          }
        } catch (error) {
          Toast.error(error?.response?.data?.message || 'Remote search failed');
        } finally {
          setIsSearchingServer(false);
        }
      }, 350); // 350ms debounce

      return () => clearTimeout(timer);
    }
  }, [visible.length, search, searchByDate]);

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

      <div className="rounded-xl flex justify-center items-center">
        <CustomInput
          parent_className="w-auto"
          className="rounded-lg bg-transparent px-3 py-2 w-[350px]"
          value={search}
          placeholder="Search serial, SKU, product, lot or campaign"
          onChange={event => setSearch(event.target.value)}
        />
        <DateInput
          className="ml-3 w-fit"
          singleValue={searchByDate}
          mode="single"
          onChange={value => setSearchByDate(value)}
        />
      </div>

      {isSearchingServer && (
        <p className="text-center text-xs text-blue-400 animate-pulse">
          Searching server for additional records...
        </p>
      )}

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
              <tr key={serial._id || serial.serialNo} className="border-b border-white-100 last:border-0">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(serial.serialNo)}
                    onChange={() =>
                      setSelected(current =>
                        selectedSet.has(serial.serialNo)
                          ? current.filter(value => value !== serial.serialNo)
                          : [...current, serial.serialNo]
                      )
                    }
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
                <td className="p-3">
                  {serial.catchQuantity ?? '—'} {serial.catchUom || ''}
                </td>
                <td className="p-3">
                  {serial.manufacturedAt ? new Date(serial.manufacturedAt).toLocaleString() : '—'}
                </td>
                <td className="p-3">
                  <a
                    className="text-blue-500 hover:underline"
                    href={`/trace/${serial.serialNo}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {!visible.length && !isSearchingServer && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-secondary-text">
                  No serials match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {serials.length >= 1000 && (
        <p className="text-sm text-amber-400">
          Showing the first 1,000 records. Remote search automatically queries older records if not found locally.
        </p>
      )}
    </div>
  );
}