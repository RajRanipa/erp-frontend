'use client';
// src/app/items/components/Dimension.js
import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import DimensionDialog from './DimensionDialog';
import { cn } from '../../../../utils/cn';

export default function Dimension({ formData, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const dimenstionRef = useRef(null);
  const dparams = { category: formData?.category, productType: formData?.productType };

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSaved = useCallback((doc) => {
    // doc may contain _id or value
    const newVal = doc?._id ? String(doc._id) : (doc?.value || '');
    onChange?.({ target: { name: 'dimension', value: newVal } });
    // formData.dimension = newVal;
    setOpen(false);
  }, [onChange]);

  const handleDeleted = useCallback((id) => {
    // if deleted item was selected, clear the field
    if (String(formData.dimension || '') === String(id)) {
      onChange?.({ target: { name: 'dimension', value: '' } });
    }
    setOpen(false);
  }, [formData.dimension, onChange]);

  return (
    <div className={cn(`w-full flex items-start justify-start gap-2 ${className}`)}>

      {!open && <SelectTypeInput
        name="dimension"
        label="Dimension"
        placeholder="1000 × 500 × 50"
        buttonName="Add New Dimension"
        value={formData.dimension}
        onChange={onChange}
        apiget="/api/dimensions"
        apiparams="by-id"
        params={dparams}
        callBack={handleOpen}
        required
        inputRef={dimenstionRef}
      />}

      {/* {open && */}
        <DimensionDialog
          open={open}
          onClose={handleClose}
          mode="create"
          initialData={{ category: formData?.category, productType: formData?.productType }}
          categoryReadonly={Boolean(formData?.category)}
          productTypeReadonly={Boolean(formData?.productType)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          getBackFocus={dimenstionRef}
        />
      {/* } */}
    </div>
  );
}