'use client';
import React, { useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import UnitSelect from '@/Components/inputs/UnitSelect';
import SelectWithCreateDialog from './SelectWithCreateDialog';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import Dialog from '@/Components/Dialog';
import ItemForm from '../../../../(app)/items/components/ItemForm';

export default function ProductParameters({
  enabledParameters,
  paramRequirements,
  formData,
  onChange
}) {
  const dparams = { category: formData?.category, productType: formData?.productType }
  const params = { productType: formData?.productType }
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    // 🧠 TODO: save logic here (API call, form validation, etc.)
    console.log("Saving address...");
    setOpen(false);
  };


  return (
    <div className="grid grid-cols-3 gap-4 grid-rows-[min-content] h-fit w-full mt-4">
      {enabledParameters["dimension"] && <SelectWithCreateDialog
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
      />}
      {enabledParameters["temperature"] && <SelectWithCreateDialog
        name="temperature"
        label="Temperature"
        placeholder="1050"
        buttonName="Add New Temperature"
        value={formData.temperature}
        onChange={onChange}
        initialDraft={{ value: '', productType: '', unit: '˚C' }}
        renderDialog={(draft, onDraftChange) => (
          <>
            <CustomInput type="number" name="value" placeholder="value" value={draft.value} onChange={onDraftChange} />
            <UnitSelect name="unit" type="Temperature" value={draft.unit} onChange={onDraftChange} />
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
          value: Number(d.value),
          productType: d.productType,
          unit: (d.unit || '').trim()
        })}
        parseLabel={(label) => {
          const m = label.match(/^(\d+(?:\.\d+)?)\s*(\S+)?$/);
          return m ? { value: m[1], unit: m[2] || '˚C' } : {};
        }}
        apiget="/api/temperatures"
        createUrl="/api/temperatures"
        apiparams="by-id"
        params={params}
      />}
      {enabledParameters["density"] && <SelectWithCreateDialog
        name="density"
        label="Density"
        placeholder="96"
        buttonName="Add New Density"
        value={formData.density}
        onChange={onChange}
        initialDraft={{ value: '', unit: 'kg/m³', productType: '' }}
        renderDialog={(draft, onDraftChange) => (
          <>
            <CustomInput type="number" name="value" placeholder="value" value={draft.value} onChange={onDraftChange} />
            <UnitSelect name="unit" type="Density" value={draft.unit} onChange={onDraftChange} />
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
          value: Number(d.value),
          productType: d.productType,
          unit: (d.unit || '').trim()
        })}
        parseLabel={(label) => {
          const m = label.match(/^(\d+(?:\.\d+)?)\s*(.+)?$/);
          return m ? { value: m[1], unit: m[2] || 'kg/m³' } : {};
        }}
        apiget="/api/densities"
        createUrl="/api/densities"
        apiparams="by-id"
        params={params}
      />}
      {enabledParameters["packing"] &&
        <div className="w-full flex items-start justify-start flex-1/3 gap-2 flex-col py-2 px-4 border border-color-300 rounded-lg">
          {/* <p className="capitalize">Packing</p> */}
          <div className="flex gap-4 w-full mt-4">
            <SelectTypeInput
              type="text"
              name="packing"
              label={"Packing"}
              placeholder="Plastic Bag"
              apiget="/api/items/packings"
              apiparams="by-id"
              params={params}
              value={formData.packing}
              onChange={onChange}
              required
              allowCustomValue={false}
              buttonName={'add packing item'}
              callBack={handleOpen}
            />
          </div>
          <Dialog
            open={open}
            title="Add a new packing item"
            onClose={handleClose}
            side="right"
            size="md"
            actions={
              <>
                <button type="button" className="btn" onClick={handleClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>
                  Save
                </button>
              </>
            }
          >
            <ItemForm />
          </Dialog>
        </div>
      }
      
    </div>
  );
}