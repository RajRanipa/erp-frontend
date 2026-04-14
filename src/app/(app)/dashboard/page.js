// src/app/(app)/dashboard/page.js
'use client';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import DisplayMain from '@/Components/layout/DisplayMain';
import { Toast } from '@/Components/toast';
import { useState } from 'react';
import useAuthz from '@/hooks/useAuthz';
import CustomInput from '@/Components/inputs/CustomInput';
import DateInput from '@/Components/inputs/DateInput';

const InventoryPage = () => {

  const { can, mounted } = useAuthz();

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [date, setDate] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');

  console.log("selectedLabel", selectedLabel);
  return (
    <>
      {can('dashboard:read') && <div>
        {/* <p>All your producttion will show here.</p> */}
        {/* <button
          onClick={() => {
            Toast.success('Saved successfully!', {
              duration: 4000,
              placement: 'bottom-right',
            });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-6"
        >
          Test Toast
        </button> */}

        <div className='w-full flex justify-between items-center'>
          <div>
            <DateInput
              name="date"
              label="Custom Analytics Range"
              mode="range"
              rangeValues={dateRange}
              onChange={(val) => setDateRange(val)}
            />
          </div>
          <div className='flex items-center gap-2 justify-center'>
            {/* <DateInput
              parent_className='m-0'
              mode="range"
            /> */}
          </div>
        </div>
      </div>}
      {!can('dashboard:read') && <div className='w-full h-full flex p-8 justify-center text-base capitalize text-white-400'> dashboard is in devlopment phase </div>}
    </>
  );
};

export default InventoryPage;