'use client';
// src/app/items/create/page.js
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/Components/toast';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import CoreProductFieldsComponent from './CoreProductFields';
import ProductParametersComponent from './ProductParameters';
import ParameterToggleBarComponent from './ParameterToggleBar';
import useProductForm from '../hooks/useProductForm';

const ProductParameters = React.memo(ProductParametersComponent);
const CoreProductFields = React.memo(CoreProductFieldsComponent);
const ParameterToggleBar = React.memo(ParameterToggleBarComponent);

export default function ItemForm({ mode = 'create', initialData = {}, onsubmit = () => {} }) {
  // console.log('initialData', initialData);
  const router = useRouter();
  const {
    formData,
    dispatch,
    errors,
    setErrors,
    enabledParameters,
    toggleParameter,
    handleChange,
    submit,
    remove,
    paramRequirements,
  } = useProductForm({ mode, initialData });
  const [catagory, setCatagory] = useState(null);
  
  const handleLocalChange = useCallback((eOrName) => {
  // console.log('handleLocalChange', eOrName);

  if (eOrName && eOrName.target) {
    const { name, value } = eOrName.target;
    const labelValue = eOrName.label?.value ?? value;

    // Update main formData via useProductForm handleChange
    handleChange(name, value);

    // Optionally keep a local label copy for conditional rendering
    if (name === 'category') setCatagory(labelValue);

    // If you need to store category_label in formData, you can dispatch SET_FIELD
    if (name === 'category') {
      dispatch({ type: 'SET_FIELD', field: `${name}_label`, value: labelValue });
    }
  }
}, [handleChange, dispatch]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const doc = await submit(mode);
      console.log('doc', doc);
      // on success navigate or show toast (submit already shows toast)
       if(onsubmit) {
        onsubmit();
        return;
      }

      if (mode === 'create') {
        router.push('/items');
      }
    } catch (err) {
      // errors already handled in hook
    }
  }, [submit, mode, router, onsubmit]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className='grid grid-cols-4 gap-4 grid-rows-[min-content]' >
          {/* {(mode == 'create')&&  */}
          <SelectTypeInput
            label="Category"
            placeholder="Category"
            name="category"
            value={formData.category}
            onChange={handleLocalChange}
            required
            apiget='/api/category'
            apipost={'/api/category'}
            // allowCustomValue={false}
          />
          {/* } */}
          {/* {(mode !== 'create') && <SelectTypeInput
            label="Category"
            placeholder="Category"
            name="category"
            value={userSelectedValue}
            onChange={handleLocalChange}
            readOnly={true}
            required
            apiget='/api/category'
            allowCustomValue={false}
            userSelectedValue={userSelectedValue}
          />} */}

          {catagory && formData.category_label && <CoreProductFields formData={formData} onChange={handleLocalChange} errors={errors} />}

          {catagory && (formData.category_label === 'raw material'|| formData.productType) && formData.name && formData.product_unit && 
          <div className='col-span-4 bg-white-100 p-4 rounded-lg flex flex-col items-start justify-start gap-2 shadow-sm'>
              <h2 className="text-lg font-bold flex-1/1">Product Parameters</h2>
              <ParameterToggleBar
                  productParameters={productParameters}
                  enabledParameters={enabledParameters}
                  onToggle={toggleParameter}
              />
              <p className='text-white-500'> *add parameters as per your requirement related to product</p>
              <ProductParameters
                  enabledParameters={enabledParameters}
                  paramRequirements={paramRequirements}
                  formData={formData}
                  onChange={handleLocalChange}
              />
          </div>}
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-4"
        >
          {mode === 'create' ? 'Save Product' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}
import { productParameters } from '../../../../config/productConfig';