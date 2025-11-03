'use client';
// src/app/items/components/Temperature.js
import React, { useCallback, useRef, useState } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import TemperatureDialog from './TemperatureDialog';
import { cn } from '../../../../utils/cn';

export default function Temperature({ formData, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState({});
  const temperatureSelectRef = useRef(null);

  const params = { productType: formData?.productType };

  const handleOpen = useCallback((data) => {
    setInitialData({ productType: formData?.productType, value: data?.value });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // return focus to select after portal unmount
  }, []);

  const handleSaved = useCallback((doc) => {
    // doc may contain _id or value
    const newVal = doc?._id ? String(doc._id) : (doc?.value || '');
    onChange?.({ target: { name: 'temperature', value: newVal } });
    setOpen(false);
  }, [onChange]);

  const handleDeleted = useCallback((id) => {
    // if deleted item was selected, clear the field
    if (String(formData.temperature || '') === String(id)) {
      onChange?.({ target: { name: 'temperature', value: '' } });
    }
    setOpen(false);
  }, [formData.temperature, onChange]);

  return (
    <div className={cn(`w-full flex items-start justify-start gap-2 ${className}`)}>
      <SelectTypeInput
        inputRef={temperatureSelectRef}
        name="temperature"
        label="Temperature"
        placeholder="e.g 1260"
        buttonName="Add New Temperature"
        value={formData.temperature}
        onChange={onChange}
        apiget="/api/temperatures"
        apiparams="by-id"
        params={params}
        callBack={handleOpen}
        required
      />

      {/* {open && */}
        <TemperatureDialog
          open={open}
          onClose={handleClose}
          mode="create"
          initialData={initialData}
          categoryReadonly={Boolean(formData?.category)}
          productTypeReadonly={Boolean(formData?.productType)}
          getBackFocus={temperatureSelectRef}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      {/* } */}
    </div>
  );
}