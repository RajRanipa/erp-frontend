'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import ProductionTable from './components/ProductionTable';
import DateInput from '@/Components/inputs/DateInput';
import ProductionTableSpecific from './components/ProductionTableSpecific';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { filter1Icon } from '@/utils/SVG';
import SelectInput from '@/Components/inputs/SelectInput';

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

  const [dateRange, setDateRange] = useState({
    start: '2026-07-17',
    end: '2026-07-17',
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
    console.log('filters', filters);
  }, [filters]);

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
        // console.log('qs', qs);
        const url = `/api/production${qs ? `?${qs}` : ''}`;
        const res = await axiosInstance.get(url);

        if (ignore) return;

        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const specificList = Array.isArray(res?.data?.specificData) ? res.data.specificData : [];
        setProductions(list);
        setSpecificProductions(specificList);
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
    <div className='w-full'>
      <div className='flex items-center justify-between mb-4'>
        <div className='fllex gap-2'><span>Check Production :- </span><span>{dateRange?.start + " to " + dateRange?.end}</span></div>
        <div className='flex gap-4'>

          <SelectInput
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

          <SelectTypeInput
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
