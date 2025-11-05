'use client';
// src/app/items/components/Density.js
import React, { useCallback, useRef, useState } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import DensityDialog from './DensityDialog';
import { cn } from '../../../../utils/cn';

export default function Density({ formData, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState({});
  const densitySelectRef = useRef(null);
  // console.log("open", open)
  const params = { productType: formData?.productType };

  const handleOpen = useCallback((data) => {
    setInitialData({ productType: formData?.productType, value: data?.value });
    setOpen(true);
  }, [formData?.productType]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSaved = useCallback((doc) => {
    // doc may contain _id or value
    const newVal = doc?._id ? String(doc._id) : (doc?.value || '');
    onChange?.({ target: { name: 'density', value: newVal } });
    setOpen(false);
  }, [onChange]);

  const handleDeleted = useCallback((id) => {
    // if deleted item was selected, clear the field
    if (String(formData.density || '') === String(id)) {
      onChange?.({ target: { name: 'density', value: '' } });
    }
    setOpen(false);
  }, [formData.density, onChange]);

  return (
    <div className={cn(`w-full flex items-start justify-start gap-2 ${className}`)}>
      {!open && <SelectTypeInput
        inputRef={densitySelectRef}
        name="density"
        label="Density"
        placeholder="e.g 96"
        buttonName="Add New Density"
        value={formData.density}
        onChange={onChange}
        apiget="/api/densities"
        apiparams="by-id"
        params={params}
        callBack={handleOpen}
        required
      />}

      {/* {open &&  */}
      <DensityDialog
        open={open}
        onClose={handleClose}
        mode="create"
        initialData={initialData}
        categoryReadonly={Boolean(formData?.category)}
        productTypeReadonly={Boolean(formData?.productType)}
        getBackFocus={densitySelectRef}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
      {/* } */}
    </div>
  );
}