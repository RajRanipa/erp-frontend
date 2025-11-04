'use client';
// src/app/items/hooks/useProductForm.js
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { productParameters } from '../../../../config/productConfig';
// import { formReducer } from '../../(app)/items/components/formReducer';
import { Toast } from '@/Components/toast';

// --- formReducer logic (inlined from formReducer.js) ---
const formReducer = (state, action) => {
//   console.log('formReducer action:', action.type, action);
  switch (action.type) {
    case 'SET_FIELD': {
      let value = action.value;
      if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
        value = Number(value);
      }
      return { ...state, [action.field]: value };
    }

    case 'TOGGLE_PARAMETER': {
      const param = productParameters.find(p => p.key === action.key);
      if (!param) return state;

      const fields = Array.isArray(param.fields) ? param.fields : [];
      const getName = (f) => (typeof f === 'string' ? f : f?.name);

      if (action.enabled) {
        const newFields = {};
        if (fields.length > 0) {
          fields.forEach(f => {
            const name = getName(f);
            if (name) newFields[name] = '';
          });
        } else if (param.key) {
          // If no fields defined, use the top-level key as a single value holder
          newFields[param.key] = '';
        }
        return { ...state, ...newFields };
      } else {
        const newState = { ...state };
        if (fields.length > 0) {
          fields.forEach(f => {
            const name = getName(f);
            if (name) delete newState[name];
          });
        }
        // Also clean up the top-level key if it was used
        if (param.key) delete newState[param.key];
        return newState;
      }
    }

    case 'RESET_FORM':
      return action.initialState || action.payload || {};

    default:
      return state;
  }
};

// Minimal default initial form shape used for seeding state
const initialFormStateDefault = {
    category: '',
    category_label: '',
    name: '',
    product_unit: '',
    currentStock: '',
    minimumStock: '0',
    description: '',
};

/**
 * useProductForm
 * Encapsulates product form state, parameter toggles, transform & submit logic.
 *
 * @param {Object} opts
 * @param {'create'|'edit'} opts.mode
 * @param {Object} opts.initialData - when editing, seed values
 */
export default function useProductForm({ mode = 'create', initialData = {} } = {}) {
    
    const [errors, setErrors] = useState({});
    // console.log('initialData in useProductForm:', initialData);
    // merged initial state (memoized)
    const mergedInitialState = useMemo(() => ({
      ...initialFormStateDefault, // default fields
      ...initialData,             // include all fields from existing product
    }), [initialData]);

    const [formData, dispatch] = useReducer(formReducer, mergedInitialState);

    // useEffect(() => { console.log('formData after seed:', formData); }, [formData]);

    // If initialData changes while in edit mode, reseed the reducer state
    useEffect(() => {
      if (mode === 'edit') {
        const seed = {
          ...initialFormStateDefault,
          ...initialData, // preserve all initial data fields
        };
        dispatch({ type: 'RESET_FORM', initialState: seed });
        // console.log('dispatch RESET_FORM seed:', seed);
      }
    }, [initialData, mode]);

    // compute enabledParameters based on presence of keys/fields in formData
    const enabledParameters = useMemo(() => {
        const enabled = {};
        (productParameters || []).forEach((param) => {
            const key = param?.key;
            const fields = Array.isArray(param?.fields) ? param.fields : [];
            const hasKey = key ? Object.prototype.hasOwnProperty.call(formData, key) : false;
            const hasAnyField = fields.some((f) => {
                const name = typeof f === 'string' ? f : f?.name;
                return name ? Object.prototype.hasOwnProperty.call(formData, name) : false;
            });
            enabled[key] = hasKey || hasAnyField;
        });
        return enabled;
    }, [formData]);

    const handleChange = useCallback((eOrName, maybeValue) => {
        // console.log('handleChange', eOrName, maybeValue);
        let name, value;
        if (eOrName && eOrName.target) {
            name = eOrName.target.name;
            value = eOrName.target.value;
        } else {
            name = eOrName;
            value = maybeValue;
        }

        if (name === 'category' && !initialData.category) {
            // preserve existing category_label (from current formData) or fallback to initialData
            const preservedLabel = (typeof formData !== 'undefined' && formData.category_label) ||
                (initialData && initialData.category_label) ||
                '';
            const resetState = { ...initialFormStateDefault, category_label: preservedLabel };
            dispatch({ type: 'RESET_FORM', initialState: resetState }); // it's resetting the whole form
            dispatch({ type: 'SET_FIELD', field: name, value });
        } else {
            dispatch({ type: 'SET_FIELD', field: name, value });
        }
    }, [formData, initialData]);

    const toggleParameter = useCallback((key) => {
        const willEnable = !(enabledParameters && enabledParameters[key]);
        dispatch({ type: 'TOGGLE_PARAMETER', key, enabled: willEnable });
    }, [enabledParameters]);

    // transform formData into API payload
    function transformFormData(localFormData, enabledParams) {
        const cleanedFormData = { ...localFormData };
        const finalData = {};

        (productParameters || []).forEach(param => {
            if (enabledParams[param.key]) {
                const obj = {};
                const tFields = Array.isArray(param.fields) ? param.fields : [];
                tFields.forEach((field) => {
                    const fname = typeof field === 'string' ? field : field?.name;
                    if (fname && Object.prototype.hasOwnProperty.call(cleanedFormData, fname)) {
                        obj[fname] = cleanedFormData[fname];
                        delete cleanedFormData[fname];
                    }
                });
                if (param.unitName && cleanedFormData[param.unitName]) {
                    obj.unit = cleanedFormData[param.unitName];
                    delete cleanedFormData[param.unitName];
                }
                if (param.uniqueName && cleanedFormData[param.uniqueName]) {
                    obj.unique = cleanedFormData[param.uniqueName];
                    delete cleanedFormData[param.uniqueName];
                }

                // For non-dimension params, if fields exist convert first field to value
                if (param.key !== 'dimension' && Array.isArray(param.fields) && param.fields.length > 0) {
                    const firstField = param.fields[0];
                    const firstFieldName = typeof firstField === 'string' ? firstField : firstField?.name;
                    if (firstFieldName && Object.prototype.hasOwnProperty.call(obj, firstFieldName)) {
                        obj.value = obj[firstFieldName];
                        delete obj[firstFieldName];
                    }
                }

                if (Object.keys(obj).length > 0) {
                    finalData[param.key] = obj;
                }
            }
        });

        // domain specific cleanup
        if (cleanedFormData.category === 'raw' || cleanedFormData.category === 'packing') {
            delete cleanedFormData.productType;
            delete cleanedFormData.salePrice;
        }

        return {
            ...cleanedFormData,
            ...finalData,
        };
    }

    const submit = useCallback(async (modeArg = mode, id) => {
        try {
            setErrors({});
            const payload = transformFormData(formData, enabledParameters);
            if (modeArg === 'create') {
                const res = await axiosInstance.post('/api/items', payload);
                Toast.success(res?.data?.message );
                return res?.data?.data || res?.data;
            } else {
                const docId = id || formData._id;
                if (!docId) throw new Error('Missing id for update');
                const res = await axiosInstance.put(`/api/items/${docId}`, payload);
                Toast.success(res?.data?.message || 'Updated',{ duration: 4000, autoClose: true, placement: "top-center", animation: "top-bottom" });
                return res?.data?.data || res?.data;
            }
        } catch (err) {
            console.error('submit error', err);
            if (err?.response?.data?.errors) setErrors(err.response.data.errors);
            Toast.error(err?.response?.data?.message || err.message || 'Failed');
            throw err;
        }
    }, [formData, enabledParameters, mode]);

    const remove = useCallback(async (id) => {
        try {
            const docId = id || formData._id;
            if (!docId) throw new Error('Missing id for delete');
            await axiosInstance.delete(`/api/items/${docId}`);
            Toast.success('Deleted', {duration: 4000, autoClose: true, placement: "top-center", animation: "top-bottom" });
            return true;
        } catch (err) {
            console.error('delete error', err);
            Toast.error( err?.response?.data?.message || err.message || 'Failed to delete', {duration: 4000, autoClose: true, placement: "top-center", animation: "top-bottom" });
            throw err;
        }
    }, [formData]);

    // compute paramRequirements (which parameters currently have fields)
    const paramRequirements = useMemo(() => {
        return (productParameters || []).reduce((acc, param) => {
            const rFields = Array.isArray(param.fields) ? param.fields : [];
            if (rFields.length > 0) {
                rFields.forEach((field) => {
                    const fname = typeof field === 'string' ? field : field?.name;
                    if (fname) {
                        acc[param.key] = acc[param.key] || Object.prototype.hasOwnProperty.call(formData, fname);
                    }
                });
            }
            if (param.unitName) acc[param.key] = acc[param.key] || !!formData[param.unitName];
            if (param.uniqueName) acc[param.key] = acc[param.key] || !!formData[param.uniqueName];
            return acc;
        }, {});
    }, [formData]);

    return {
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
    };
}