'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SerialLabels from '../components/SerialLabels';
import CustomInput from '@/Components/inputs/CustomInput';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import DateInput from '@/Components/inputs/DateInput';

export default function InventorySerialRegistryPage() {
  const [serials, setSerials] = useState([]);
  const [serialNoFilter, setSerialNoFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [qualityStatusFilter, setQualityStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selected, setSelected] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Tracks executed query signatures to avoid duplicate network calls
  const executedServerQueries = useRef(new Set());

  // 1. Initial Load
  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/inventory/serials', {
        params: { limit: 500 },
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

  // 2. Client-Side Multi-field Filtering
  const visible = useMemo(() => {
    const sNo = serialNoFilter.trim().toLowerCase();
    const sku = skuFilter.trim().toLowerCase();
    const status = qualityStatusFilter.trim().toUpperCase();
    const targetDate = dateFilter ? String(dateFilter).trim() : '';
    console.log("1.visible -> sNo, sku, status, targetDate", sNo, sku, status, targetDate);
    if (!sNo && !sku && !status && !targetDate) return serials;

    return serials.filter(serial => {
      // Serial match
      const matchSerial = !sNo || String(serial.serialNo || '').toLowerCase().includes(sNo);

      // SKU match
      const matchSku = !sku || String(serial.itemId?.sku || '').toLowerCase().includes(sku);

      // Status match (checks serial or lot status)
      const currentStatus = String(serial.qualityStatus || serial.lotId?.qualityStatus || '').toUpperCase();
      const matchStatus = !status || currentStatus === status;

      // Date match (checks YYYY-MM-DD format against manufacturedAt or createdAt)
      let matchDate = true;
      if (targetDate) {
        const dateSource = serial.manufacturedAt || serial.createdAt;
        const serialDateStr = dateSource ? new Date(dateSource).toISOString().slice(0, 10) : '';
        matchDate = serialDateStr === targetDate;
      }

      return matchSerial && matchSku && matchStatus && matchDate;
    });
  }, [serials, serialNoFilter, skuFilter, qualityStatusFilter, dateFilter]);

  // 3. Fallback: Trigger API call when local matching records < 5
  useEffect(() => {
    const sNo = serialNoFilter.trim();
    const sku = skuFilter.trim();
    const status = qualityStatusFilter.trim();
    const date = dateFilter ? String(dateFilter).trim() : '';
    // Abort if no criteria is filled
    if (!sNo && !sku && !status && !date) return;
    
    console.log("2. sNo, sku, status, date", sNo, sku, status, date);
    console.log("executedServerQueries", executedServerQueries)
    const queryKey = `${sNo}__${sku}__${status}__${date}`;
    if (executedServerQueries.current.has(queryKey)) return;

    if (visible.length <= 5) {
      const timer = setTimeout(async () => {
        try {
          setIsSearchingServer(true);

          // Structured payload expected by backend
          const params = {
            serialNo: sNo || undefined,
            sku: sku || undefined,
            qualityStatus: status || undefined,
            date: date || undefined,
            limit: 50,
          };

          const response = await axiosInstance.get('/api/inventory/serials', { params });
          const serverResults = response.data || [];
          executedServerQueries.current.add(queryKey);

          if (serverResults.length > 0) {
            setSerials(prev => {
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
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [visible.length, serialNoFilter, skuFilter, qualityStatusFilter, dateFilter]);

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

      {/* 4-Input Structured Search Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <CustomInput
          label="Serial Number"
          name="serialNo"
          value={serialNoFilter}
          placeholder="e.g. SN-2026-001"
          onChange={event => setSerialNoFilter(event.target.value)}
        />
        <CustomInput
          label="SKU"
          name="sku"
          value={skuFilter}
          placeholder="e.g. BLKT-1260-96"
          onChange={event => setSkuFilter(event.target.value)}
        />
        <AdaptiveSelectInput
          label="Quality Status"
          name="qualityStatus"
          value={qualityStatusFilter}
          options={[
            { value: 'AVAILABLE', label: 'Available' },
            { value: 'HOLD', label: 'Hold' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          onChange={event => setQualityStatusFilter(event.target.value)}
        />
        <DateInput
          label={"Select Date"}
          className="w-full"
          singleValue={dateFilter}
          mode="single"
          onChange={value => setDateFilter(value)}
        />
      </div>

      {isSearchingServer && (
        <p className="text-center text-xs text-blue-400 animate-pulse">
          Searching server for records matching criteria...
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white-100">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white-100 text-secondary-text">
            <tr>
              <th className="p-3">Print</th>
              <th className="p-3">Serial</th>
              <th className="p-3">Product / SKU</th>
              <th className="p-3">Status</th>
              <th className="p-3">Lot / Campaign</th>
              <th className="p-3">Weight</th>
              <th className="p-3">Manufactured</th>
              <th className="p-3">Trace</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(serial => {
              const currentStatus = serial.qualityStatus || serial.lotId?.qualityStatus || '—';
              return (
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
                  <td className="p-3 font-mono font-medium">{serial.serialNo}</td>
                  <td className="p-3">
                    <p>{serial.itemId?.name || '—'}</p>
                    <p className="text-xs text-secondary-text">{serial.itemId?.sku || '—'}</p>
                  </td>
                  <td className="p-3">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {currentStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <p>{serial.lotId?.lotNo || '—'}</p>
                    <p className="text-xs text-secondary-text">{serial.campaignId?.name || '—'}</p>
                  </td>
                  <td className="p-3">
                    {serial.catchQuantity ?? '—'} {serial.catchUom || ''}
                  </td>
                  <td className="p-3">
                    {serial.manufacturedAt ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-secondary-text ">
                          {new Intl.DateTimeFormat('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(serial.manufacturedAt)).replace(/\//g, '-')}
                        </span>
                        <span className="text-xs text-primary-text tracking-wide">
                          {(() => {
                            const d = new Date(serial.manufacturedAt);
                            let hours = d.getHours();
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const seconds = String(d.getSeconds()).padStart(2, '0');
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            hours = hours % 12 || 12;
                            const formattedHours = String(hours).padStart(2, '0');
                            return `${formattedHours} : ${minutes} : ${seconds} ${ampm}`;
                          })()}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
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
              );
            })}
            {!visible.length && !isSearchingServer && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-secondary-text">
                  No serials match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}