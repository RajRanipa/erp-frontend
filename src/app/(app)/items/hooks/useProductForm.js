'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import { productParameters } from '../../../../config/productConfig';
import formReducer from '../components/formReducer';

const REFERENCE_FIELDS = ['productType', 'temperature', 'density', 'dimension', 'packing'];

const initialFormState = {
  category: '',
  category_label: '',
  name: '',
  UOM: '',
  minimumStock: '0',
  description: '',
  grade: '',
  brandType: '',
  productColor: '',
};

const isBlank = value =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const categoryKeyFromLabel = label => {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized === 'finished goods') return 'FG';
  if (normalized === 'raw material') return 'RAW';
  if (normalized === 'packing material') return 'PACKING';
  if (normalized === 'non-conformance') return 'NC';
  return '';
};

const requiredParametersFor = formData => {
  const categoryKey = categoryKeyFromLabel(formData.category_label);
  const productType = String(formData.productType_label || '').trim().toLowerCase();

  if (categoryKey === 'PACKING') return ['dimension'];
  if (categoryKey !== 'FG') return [];
  if (productType === 'bulk') return ['temperature', 'packing'];
  if (productType === 'board') return ['dimension', 'temperature', 'packing'];
  return ['dimension', 'density', 'temperature', 'packing'];
};

function validate(formData, requiredParameters) {
  const errors = {};
  const categoryKey = categoryKeyFromLabel(formData.category_label);

  if (isBlank(formData.category)) errors.category = 'Category is required';
  if (isBlank(formData.name)) errors.name = 'Name is required';
  if (isBlank(formData.UOM)) errors.UOM = 'Unit is required';

  const minimumStock = Number(formData.minimumStock || 0);
  if (!Number.isFinite(minimumStock) || minimumStock < 0) {
    errors.minimumStock = 'Minimum stock must be a non-negative number';
  }

  if (['FG', 'PACKING'].includes(categoryKey) && isBlank(formData.productType)) {
    errors.productType = 'Product type is required';
  }

  for (const field of requiredParameters) {
    if (isBlank(formData[field])) {
      const label = productParameters.find(item => item.key === field)?.label || field;
      errors[field] = `${label} is required`;
    }
  }

  return errors;
}

function buildPayload(formData, mode) {
  const categoryKey = categoryKeyFromLabel(formData.category_label);
  const payload = {
    category: formData.category,
    name: String(formData.name || '').trim(),
    UOM: String(formData.UOM || '').trim(),
    minimumStock: Number(formData.minimumStock || 0),
    description: String(formData.description || '').trim(),
    grade: String(formData.grade || '').trim(),
    brandType: formData.brandType || '',
    productColor: String(formData.productColor || '').trim(),
  };

  if (formData.sku) payload.sku = String(formData.sku).trim();

  for (const field of REFERENCE_FIELDS) {
    payload[field] = formData[field] || null;
  }

  if (categoryKey === 'RAW') {
    Object.assign(payload, {
      productType: null,
      temperature: null,
      density: null,
      dimension: null,
      packing: null,
      brandType: '',
      productColor: '',
    });
  } else if (categoryKey === 'PACKING') {
    Object.assign(payload, {
      temperature: null,
      density: null,
      packing: null,
    });
  } else if (categoryKey === 'NC') {
    Object.assign(payload, {
      productType: null,
      temperature: null,
      density: null,
      dimension: null,
      packing: null,
      brandType: '',
      productColor: '',
    });
  }

  if (mode === 'create') {
    for (const field of REFERENCE_FIELDS) {
      if (payload[field] === null) delete payload[field];
    }
  }

  return payload;
}

const backendErrorsToObject = responseData => {
  const details = responseData?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((result, item) => {
    if (item?.field) result[item.field] = item.message;
    return result;
  }, {});
};

export default function useProductForm({ mode = 'create', initialData = {} } = {}) {
  const mergedInitialState = useMemo(
    () => ({ ...initialFormState, ...initialData }),
    [initialData],
  );
  const [formData, dispatch] = useReducer(formReducer, mergedInitialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch({ type: 'RESET_FORM', initialState: mergedInitialState });
  }, [mergedInitialState]);

  const requiredParameters = useMemo(
    () => requiredParametersFor(formData),
    [formData],
  );

  useEffect(() => {
    const missingFields = requiredParameters.reduce((result, field) => {
      if (!Object.prototype.hasOwnProperty.call(formData, field)) {
        result[field] = '';
      }
      return result;
    }, {});
    if (Object.keys(missingFields).length) {
      dispatch({ type: 'SET_FIELDS', fields: missingFields });
    }
  }, [formData, requiredParameters]);

  const enabledParameters = useMemo(() => {
    return productParameters.reduce((result, parameter) => {
      result[parameter.key] =
        requiredParameters.includes(parameter.key) ||
        Object.prototype.hasOwnProperty.call(formData, parameter.key);
      return result;
    }, {});
  }, [formData, requiredParameters]);

  const handleChange = useCallback((eventOrName, maybeValue) => {
    const name = eventOrName?.target?.name || eventOrName;
    const value = eventOrName?.target?.value ?? maybeValue;
    dispatch({ type: 'SET_FIELD', field: name, value });
    setErrors(current => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const resetForCategory = useCallback((category, categoryLabel) => {
    dispatch({
      type: 'RESET_FORM',
      initialState: {
        ...initialFormState,
        ...(formData._id ? { _id: formData._id } : {}),
        category,
        category_label: categoryLabel,
      },
    });
    setErrors({});
  }, [formData._id]);

  const toggleParameter = useCallback((key) => {
    if (requiredParameters.includes(key)) return;
    dispatch({
      type: 'TOGGLE_PARAMETER',
      key,
      enabled: !enabledParameters[key],
    });
  }, [enabledParameters, requiredParameters]);

  const submit = useCallback(async () => {
    setErrors({});
    const clientErrors = validate(formData, requiredParameters);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      Toast.error('Please correct the highlighted fields');
      throw new Error('Client validation failed');
    }

    const payload = buildPayload(formData, mode);

    try {
      const response = mode === 'create'
        ? await axiosInstance.post('/api/items', payload)
        : await axiosInstance.put(`/api/items/${formData._id}`, payload);
      Toast.success(response?.data?.message || (mode === 'create' ? 'Item created' : 'Item updated'));
      return response?.data?.data || response?.data?.item || response?.data;
    } catch (error) {
      const backendErrors = backendErrorsToObject(error?.response?.data);
      if (Object.keys(backendErrors).length) setErrors(backendErrors);
      Toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save Item',
      );
      throw error;
    }
  }, [formData, mode, requiredParameters]);

  const remove = useCallback(async id => {
    const itemId = id || formData._id;
    if (!itemId) throw new Error('Missing Item id');
    await axiosInstance.delete(`/api/items/${itemId}`);
    Toast.success('Item archived');
    return true;
  }, [formData._id]);

  return {
    formData,
    dispatch,
    errors,
    setErrors,
    enabledParameters,
    requiredParameters,
    toggleParameter,
    handleChange,
    resetForCategory,
    submit,
    remove,
    paramRequirements: {},
  };
}
