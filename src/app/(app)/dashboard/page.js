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
  return (
    <>
      {can('dashboard:read') && <div>
        <p>Dashboard page is under devlopment</p>
      </div>}
      {!can('dashboard:read') && <div className='w-full h-full flex p-8 justify-center text-base capitalize text-white-400'> dashboard is in devlopment phase </div>}
    </>
  );
};

export default InventoryPage;