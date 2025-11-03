// src/app/items/components/ProductParameters.js
'use client';
import React, { useState } from 'react';
import Dimension from './Dimension';
import Density from './Density';
import Temperature from './Temperature';
import Packing from './Packing';

export default function ProductParameters({
  enabledParameters,
  paramRequirements,
  formData,
  onChange
}) {
  return (
    <div className="h-fit w-full">
      {
        (enabledParameters["dimension"] ||
        enabledParameters["temperature"] ||
        enabledParameters["density"] ||
        enabledParameters["packing"]) &&
        <div className='flex gap-5 flex-wrap mt-4'>
          {enabledParameters["dimension"] &&
            <Dimension
              formData={formData}
              onChange={onChange}
              className='flex-[1_0_30%]'
            />}
          {enabledParameters["temperature"] &&
            <Temperature
              formData={formData}
              onChange={onChange}
              className='flex-[1_0_30%]'
            />}
          {enabledParameters["density"] &&
            <Density
              formData={formData}
              onChange={onChange}
              className='flex-[1_0_30%]'
            />}
          {enabledParameters["packing"] &&
            <Packing
              formData={formData}
              onChange={onChange}
              className='flex-[1_0_30%]'
            />}
        </div>
      }
    </div>
  );
}

{/* {enabledParameters["dimension"] && <SelectWithCreateDialog
        name="dimension"
        label="Dimension"
        placeholder="1000 × 500 × 50" 
        buttonName="Add New Dimension"
        value={formData.dimension}
        onChange={onChange}
        initialDraft={{ length: '', width: '', thickness: '', unit: 'mm', category: '', productType: '' }}
        renderDialog={(draft, onDraftChange) => (
          <>
            <CustomInput type="number" name="length" placeholder="length" value={draft.length} onChange={onDraftChange} />
            <CustomInput type="number" name="width" placeholder="width" value={draft.width} onChange={onDraftChange} />
            <CustomInput type="number" name="thickness" placeholder="thickness" value={draft.thickness} onChange={onDraftChange} />
            <UnitSelect name="unit" type="Dimension" value={draft.unit} onChange={onDraftChange} />
            <SelectTypeInput
              placeholder="Category"
              name="category"
              value={draft.category}
              onChange={onDraftChange}
              required
              apiget='/api/category'
              allowCustomValue={false}
            />
            <SelectTypeInput
              type="text"
              name="productType"
              placeholder="Product Type"
              apiget="/api/product-type"
              value={draft.unit}
              onChange={onDraftChange}
              required
              allowCustomValue={false}
            />
          </>
        )}
        buildPayload={(d) => ({
          length: Number(d.length),
          width: Number(d.width),
          thickness: Number(d.thickness),
          category: d.category,
          productType: d.productType,
          unit: (d.unit || 'mm').trim(),
        })}
        parseLabel={(label) => {
          const m = label.match(/^(\d+)\s*x\s*(\d+)\s*x\s*(\d+)(?:\s*(\S+))?$/i);
          return m ? { length: m[1], width: m[2], thickness: m[3], unit: m[4] || 'mm' } : {};
        }}
        apiget="/api/dimensions"
        createUrl="/api/dimensions"
        apiparams="by-id"
        params={dparams}
      />} */}