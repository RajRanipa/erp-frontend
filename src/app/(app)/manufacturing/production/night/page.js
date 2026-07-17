'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import ProductionTable from '../components/ProductionTable';
import DateInput from '@/Components/inputs/DateInput';
import SubmitButton from '@/Components/buttons/SubmitButton';

export default function Production() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);
  const [productions, setProductions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [filters, setFilters] = useState({
    productType: '',
  });

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        
        const url = `/api/production/night`;
        const res = await axiosInstance.get(url);

        if (ignore) return;

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
    fetchItems()
    return () => { ignore = true; };
  }, []);

  const sentDayReport = async () => {
      setSubmitting(true);
      try{
        const res = await axiosInstance.post('/api/production/send-report', {
          shift : 'DAY'
        })
        console.log('res', res.status);
        if(res?.status === 200){
          Toast.success(res?.data?.message || 'production report sent successfully');
        }
      }catch(error){
        console.log('error', error);
        setEmailError(error);
        Toast.error(error?.response?.data?.message || 'Failed to send production report');
      }finally{
        setSubmitting(false);
      }
  
    }

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-4'>
        <div className='fllex gap-2'><span>Production for Night</span></div>
        <div>
          {/* <DateInput
            name="date"
            mode="range"
            rangeValues={dateRange}
            onChange={(val) => setDateRange(val)}
            parent_className="mb-0"
            className="w-[250px]"
          /> */}
          <SubmitButton label="Sent report to mail" loading={submitting} disabled={submitting || !!emailError} className='mb-5' onClick={sentDayReport} />
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
