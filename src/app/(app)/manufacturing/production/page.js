'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import ProductionTable from './components/ProductionTable';
import DateInput from '@/Components/inputs/DateInput';

export default function Production() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);
  const [productions, setProductions] = useState([]);
  const [refresh, setRefresh] = useState(null);
  const [filters, setFilters] = useState({
    productType: '',
  });

  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const apiparams = {};
  const mergedParams = useMemo(() => {
    if (Array.isArray(apiparams)) {
      // Merge array of param objects left-to-right
      return Object.assign({}, ...apiparams);
    }
    return apiparams || {};
  }, [apiparams]);

  useEffect(() => {
    console.log('productions', productions);
  }, [productions]);

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const startDate = dateRange?.start || '';
        const endDate = dateRange?.end || '';
        // status from prop unless caller already passed it in mergedParams
        if (startDate && endDate) params.set('startDate', startDate);
        if (startDate && endDate) params.set('endDate', endDate);

        // add all keys from mergedParams, skipping empty/undefined/null
        Object.entries(mergedParams).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '') return;
          params.set(key, String(val));
        });

        const qs = params.toString();
        console.log('qs', qs);
        const url = `/api/production${qs ? `?${qs}` : ''}`;
        const res = await axiosInstance.get(url);

        if (ignore) return;
        console.log('res', res);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setProductions(list);
      } catch (err) {
        // if (!ignore) Toast.error('Failed to load productions');
        console.error("error in fetching production", err);
        setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    (dateRange?.start && dateRange?.end) ? fetchItems() : (setLoading(false), setMsg("select date range for seeing production"));
    return () => { ignore = true; };
  }, [dateRange]);

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <div className='fllex gap-2'><span>Check Production :- </span><span>{dateRange?.start + " to " + dateRange?.end}</span></div>
        <div>
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
          </div>
      }
    </div>
  )
}
