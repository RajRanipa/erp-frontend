'use client';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import React, { useEffect, useState } from 'react'
import { apiClient, getApiErrorMessage } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import ProductionTable from './components/ProductionTable';
import DateInput from '@/Components/inputs/DateInput';
import ProductionTableSpecific from './components/ProductionTableSpecific';
import { filter1Icon } from '@/utils/SVG';

const localDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export default function Production() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);
  const [productions, setProductions] = useState([]);
  const [SpecificProductions, setSpecificProductions] = useState([]);
  const [refresh, setRefresh] = useState(null);
  const [filters, setFilters] = useState({
    productType: '',
    status: '',
  });

  const [dateRange, setDateRange] = useState(() => {
    const today = localDateString();
    return { start: today, end: today };
  });

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        const startDate = dateRange?.start || '';
        const endDate = dateRange?.end || '';
        if (startDate && endDate) params.set('startDate', startDate);
        if (startDate && endDate) params.set('endDate', endDate);

        const qs = params.toString();
        const url = `/api/production${qs ? `?${qs}` : ''}`;
        const result = await apiClient.get(url);

        if (ignore) return;

        const list = Array.isArray(result.data) ? result.data : [];
        const specificList = Array.isArray(result.meta?.specificData)
          ? result.meta.specificData
          : [];
        setProductions(list);
        setSpecificProductions(specificList);
      } catch (err) {
        if (!ignore) setError(getApiErrorMessage(err, 'Failed to load production.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    (dateRange?.start && dateRange?.end) ? fetchItems() : (setLoading(false), setMsg("select date range for seeing production"));
    return () => { ignore = true; };
  }, [dateRange?.start, dateRange?.end]);

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-4'>
        <div className='fllex gap-2'><span>Check Production :- </span><span>{dateRange?.start + " to " + dateRange?.end}</span></div>
        <div className='flex gap-4'>

          <AdaptiveSelectInput
            name="status"
            id="status"
            placeholder="status"
            value={filters.status}
            onChange={(e) => {setFilters(prev => ({...prev, status: e.target.value })) }}
            options={[
              { value: 'true', label: 'ok' },
              { value: 'false', label: 'rejected' },
            ]}
          />

          <AdaptiveSelectInput force
            name="productType"
            id="productType"
            placeholder="Product Type"
            value={filters.productType}
            onChange={(e) => {setFilters(prev => ({...prev, productType: e.target.value })) }}
            apiget="/api/product-type/options"
            icon={filter1Icon()}
          />
          <DateInput
            name="date"
            mode="range"
            rangeValues={dateRange}
            onChange={(val) => setDateRange(val)}
            parent_className="mb-0"
            className="w-[250px]"
          />
        </div>
      </div>
      {loading ? <Loading variant='skeleton' className='h-full w-full' />
        : msg ? <div className='h-full w-full flex items-center justify-center'>{msg}</div> :
          <div className='h-full w-full'>

            <ProductionTable
              rows={productions}
              loading={loading}
              error={error}
              filters={filters} // used for client-side query + productType filtering
            />
            <div className='w-full py-2'> individual production report </div>
            <ProductionTableSpecific
              rows={SpecificProductions}
              loading={loading}
              error={error}
              filters={filters} // used for client-side query + productType filtering
            />
          </div>
      }
    </div>
  )
}
