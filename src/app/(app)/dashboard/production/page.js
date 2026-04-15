'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import ProductionTable from './components/ProductionTable';

export default function Production() {
  const { dateRange } = useDateRange();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [productions, setProductions] = useState([]);
  const [refresh, setRefresh] = useState(null);
  const [filters, setFilters] = useState({
      productType: '',
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
        // console.log('dateRange', dateRange);
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
    if(dateRange?.start && dateRange?.end) fetchItems();
    return () => { ignore = true; };
  }, [dateRange]);

  return (
    <div className='h-full w-full'>
      {loading ? <Loading variant='skeleton' className='h-full w-full' />
        :
        <div className='h-full w-full'>productions data is here
          {
            productions.map((production) => (
              <div key={production?.matchedItem?._id}>

                <p>{production?.productType?.name}</p>

                <p>
                  {production?.temperature?.value} {production?.temperature?.unit}
                </p>

                <p>
                  {production?.density?.value} {production?.density?.unit}
                </p>

                <p>
                  {production?.dimension?.length} x
                  {production?.dimension?.width} x
                  {production?.dimension?.thickness}
                  {production?.dimension?.unit}
                </p>

                <p>{production?.packingItem?.name}</p>

                <p>Total rolls: {production?.totalRolls}</p>

                <p>Total Weight: {production?.totalWeight} kg</p>

              </div>
            ))
          }
          <ProductionTable
            rows={productions}
            loading={loading}
            error={error}
            filters={filters} // used for client-side query + productType filtering
            // refrence={refresh}
          />
        </div>
      }
    </div>
  )
}
