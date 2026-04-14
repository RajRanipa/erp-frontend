'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';

export default function Production() {
  const { dateRange } = useDateRange();
  const [loading, setLoading] = useState(false);
  const apiparams = {};
  const mergedParams = useMemo(() => {
    if (Array.isArray(apiparams)) {
      // Merge array of param objects left-to-right
      return Object.assign({}, ...apiparams);
    }
    return apiparams || {};
  }, [apiparams]);

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        console.log('dateRange', dateRange);
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
        // const list = Array.isArray(res?.data?.data)
        //   ? res.data.data
        //   : Array.isArray(res?.data?.items)
        //     ? res.data.items
        //     : Array.isArray(res?.data)
        //       ? res.data
        //       : [];
        // setItems(list);
      } catch (err) {
        // if (!ignore) Toast.error('Failed to load productions');
        console.error("error in fetching production", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchItems();
    return () => { ignore = true; };
  }, [dateRange]);

  return (
    <div>show all production here</div>
  )
}
