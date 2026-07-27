'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import CoreProductFields from './CoreProductFields';
import ProductParameters from './ProductParameters';
import ParameterToggleBar from './ParameterToggleBar';
import useProductForm from '../hooks/useProductForm';
import { productParameters } from '../../../../config/productConfig';

const EMPTY_INITIAL_DATA = Object.freeze({});

const categoryKeyFromLabel = label => {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized === 'finished goods') return 'FG';
  if (normalized === 'raw material') return 'RAW';
  if (normalized === 'packing material') return 'PACKING';
  if (normalized === 'non-conformance') return 'NC';
  return '';
};

export default function ItemForm({
  mode = 'create',
  initialData = EMPTY_INITIAL_DATA,
  onsubmit,
}) {
  const router = useRouter();
  const {
    formData,
    dispatch,
    errors,
    enabledParameters,
    requiredParameters,
    toggleParameter,
    handleChange,
    resetForCategory,
    submit,
  } = useProductForm({ mode, initialData });
  const [saving, setSaving] = useState(false);
  const categoryKey = categoryKeyFromLabel(formData.category_label);
  
  const identityLocked = (
    mode === 'edit' &&
    !['draft', 'rejected'].includes(formData.status)
  );

  const availableParameters = useMemo(() => {
    if (categoryKey === 'FG') return productParameters;
    if (categoryKey === 'PACKING') {
      return productParameters.filter(parameter => parameter.key === 'dimension');
    }
    return [];
  }, [categoryKey]);

  const handleLocalChange = useCallback((eventOrName, maybeValue) => {
    const event = eventOrName?.target ? eventOrName : null;
    const name = event?.target?.name || eventOrName;
    const value = event?.target?.value ?? maybeValue;
    const labelValue = eventOrName?.label?.value;

    if (name === 'category' && value !== formData.category) {
      const currentCategoryText = String(
        formData.category_label || formData.category || '',
      ).trim().toLowerCase();
      const selectedCategoryText = String(labelValue || '').trim().toLowerCase();
      if (currentCategoryText && currentCategoryText === selectedCategoryText) {
        dispatch({
          type: 'SET_FIELDS',
          fields: {
            category: value,
            category_label: labelValue,
          },
        });
        return;
      }
      resetForCategory(value, labelValue || '');
      return;
    }

    if (name === 'productType' && value !== formData.productType) {
      dispatch({
        type: 'CHANGE_PRODUCT_TYPE',
        value,
        label: labelValue || '',
      });
      return;
    }

    handleChange(name, value);
    if (labelValue !== undefined && ['category', 'productType'].includes(name)) {
      dispatch({
        type: 'SET_FIELD',
        field: `${name}_label`,
        value: labelValue,
      });
    }
  }, [
    dispatch,
    formData.category,
    formData.category_label,
    formData.productType,
    handleChange,
    resetForCategory,
  ]);

  const handleSubmit = useCallback(async event => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const savedItem = await submit();
      if (onsubmit) {
        onsubmit(savedItem);
      } else {
        router.back();
      }
    } catch {
      // Validation and API messages are handled by the form hook.
    } finally {
      setSaving(false);
    }
  }, [onsubmit, router, saving, submit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SelectTypeInput
          label="Category"
          placeholder="Select category"
          name="category"
          value={formData.category}
          onChange={handleLocalChange}
          required
          apiget="/api/category"
          allowCustomValue={false}
          readOnly={identityLocked}
          err={errors.category || ''}
        />

        {formData.category_label && (
          <CoreProductFields
            formData={formData}
            onChange={handleLocalChange}
            errors={errors}
            identityLocked={identityLocked}
          />
        )}
      </div>

      {identityLocked && (
        <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          Item specifications are locked after submission. Minimum stock and description can still be updated.
        </div>
      )}

      {!identityLocked && availableParameters.length > 0 && formData.name && formData.UOM && (
        <section className="rounded-lg bg-white-100 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Item specifications</h2>
              <p className="text-sm text-white-500">
                Required specifications stay enabled for this Item type.
              </p>
            </div>
            <ParameterToggleBar
              productParameters={availableParameters}
              enabledParameters={enabledParameters}
              requiredParameters={requiredParameters}
              onToggle={toggleParameter}
            />
          </div>

          <ProductParameters
            enabledParameters={enabledParameters}
            formData={formData}
            onChange={handleLocalChange}
            errors={errors}
          />
        </section>
      )}

      <SubmitButton
        loading={saving}
        label={mode === 'create' ? 'Create Item' : 'Update Item'}
        className="mt-4"
      />
    </form>
  );
}
