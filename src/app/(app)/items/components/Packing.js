'use client';
// src/app/items/components/Packing.js
import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import Dialog from '@/Components/Dialog';
import ItemForm from './ItemForm';
import { cn } from '../../../../utils/cn';

export default function Packing({ formData, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState({});
  const packingSelectRef = useRef(null);

  const params = { productType: formData?.productType };
  useEffect(() => {
    setInitialData(
      { category : 'packing material', 
        productType: formData?.productType,
        minimumStock : 1
      });
    // console.log('packing initialData packing ', initialData);
  }, [formData?.productType]);

  const handleOpen = useCallback((data) => {
    setInitialData(
      { category : 'packing material', 
        productType: formData?.productType,
        minimumStock : 1
      });
    setOpen(true);
  }, [formData?.productType]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // return focus to select after portal unmount
    setTimeout(() => { packingSelectRef.current?.focus?.(); }, 0);
  }, []);

  const handleSaved = useCallback((doc) => {
    // doc may contain _id or value
    const newVal = doc?._id ? String(doc._id) : (doc?.value || '');
    onChange?.({ target: { name: 'packing', value: newVal } });
    setOpen(false);
    setTimeout(() => { packingSelectRef.current?.focus?.(); }, 0);
  }, [onChange]);

  const handleDeleted = useCallback((id) => {
    // if deleted item was selected, clear the field
    if (String(formData.packing || '') === String(id)) {
      onChange?.({ target: { name: 'packing', value: '' } });
    }
    setOpen(false);
  }, [formData.packing, onChange]);

  return (
    <div className={cn(`w-full flex items-start justify-start gap-2 ${className}`)}>
      {!open && <SelectTypeInput
        inputRef={packingSelectRef}
        name="packing"
        label="Packing"
        placeholder="e.g 1260"
        buttonName="Add New Packing"
        value={formData.packing}
        onChange={onChange}
        apiget="/api/items/packings"
        apiparams="by-id"
        params={params}
        callBack={handleOpen}
        required
        dropdownHeight={"max-h-60"}
      />}

      {/* <PackingDialog
        open={open}
        onClose={handleClose}
        categoryReadonly={Boolean(formData?.category)}
        productTypeReadonly={Boolean(formData?.productType)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      /> */}
      {/* {open && */}
        <Dialog
          open={open}
          title="Add a new packing item"
          onClose={handleClose}
          side="right"
          size="xl"
          getBackFocus={packingSelectRef}
        >
          <ItemForm
            initialData={initialData}
            onsubmit={handleClose}
          />
        </Dialog>
      {/* } */}
    </div>
  );
}