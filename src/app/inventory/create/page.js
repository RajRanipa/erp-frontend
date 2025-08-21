'use client';

import React, { useReducer, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '../../../lib/axiosInstance';
import Inventory from '../page';
import ProductParametersComponent from '@/components/inventory/ProductParameters';
import CoreProductFieldsComponent from '@/components/inventory/CoreProductFields';
import ParameterToggleBarComponent from '@/components/inventory/ParameterToggleBar';
import { productParameters } from '@/config/productConfig';
import { formReducer } from '@/components/inventory/formReducer';
import validateProductForm from '@/utils/validateProductForm';
import { useToast } from '@/components/toast';
import SelectTypeInput from '@/components/SelectTypeInput';

const ProductParameters = React.memo(ProductParametersComponent);
const CoreProductFields = React.memo(CoreProductFieldsComponent);
const ParameterToggleBar = React.memo(ParameterToggleBarComponent);

const initialFormState = {
    category: '',
    productName: '',
    product_unit: 'pcs',
    currentStock: '',
    minimumStock: '',
    description: '',
};

export default function AddProductPage() {
    const toast = useToast();
    const router = useRouter();
    const [catagory, setCatagory] = useState(null);

    const [formData, dispatch] = useReducer(formReducer, {
        ...initialFormState,
    });
    const [errors, setErrors] = useState({});

    const enabledParameters = useMemo(() => {
        const enabled = {};
        (productParameters || []).forEach((param) => {
            const key = param?.key;
            const fields = Array.isArray(param?.fields) ? param.fields : [];

            // Enabled if the top-level key is PRESENT in formData
            const hasKey = key ? Object.prototype.hasOwnProperty.call(formData, key) : false;

            // Or if ANY of the declared fields are PRESENT in formData
            const hasAnyField = fields.some((f) => {
                const name = typeof f === 'string' ? f : f?.name;
                return name ? Object.prototype.hasOwnProperty.call(formData, name) : false;
            });

            enabled[key] = hasKey || hasAnyField;
        });
        return enabled;
    }, [formData, productParameters]);

    const handleChange = useCallback((eOrName, maybeValue) => {
        let name, value;
        if (eOrName && eOrName.target) {
            // Standard event from <input> or <select>
            name = eOrName.target.name;
            value = eOrName.target.value;
        } else {
            // Direct call: handleChange(name, value)
            name = eOrName;
            value = maybeValue;
        }
        dispatch({ type: 'SET_FIELD', field: name, value });
        if (name === 'category') setCatagory(value);
        // console.log(name, value);
        // Existing logic for resetting parameters if productType changes
        if (name === 'productType') {
            productParameters.forEach(param => {
                if (['dimension', 'weight', 'density', 'temperature', 'volume', 'packing'].includes(param.key)) {
                    // no special logic here, but could be extended if needed
                }
            });
        }
    }, []);

    const toggleParameter = useCallback((key) => {
        const willEnable = !enabledParameters[key];
        dispatch({ type: 'TOGGLE_PARAMETER', key, enabled: willEnable });
    }, [enabledParameters]);

    function transformFormData(formData, enabledParameters) {
        const cleanedFormData = { ...formData };
        const finalData = {};

        productParameters.forEach(param => {
            if (enabledParameters[param.key]) {
                const obj = {};

                // Add all fields belonging to this parameter
                const tFields = Array.isArray(param.fields) ? param.fields : [];
                tFields.forEach((field) => {
                    const fname = typeof field === 'string' ? field : field?.name;
                    if (fname && Object.prototype.hasOwnProperty.call(cleanedFormData, fname)) {
                        obj[fname] = cleanedFormData[fname];
                        delete cleanedFormData[fname];
                    }
                });

                // Add unit if exists
                if (param.unitName && cleanedFormData[param.unitName]) {
                    obj.unit = cleanedFormData[param.unitName];
                    delete cleanedFormData[param.unitName];
                }

                // Add unique if exists
                if (param.uniqueName && cleanedFormData[param.uniqueName]) {
                    obj.unique = cleanedFormData[param.uniqueName];
                    delete cleanedFormData[param.uniqueName];
                }

                if (param.key !== 'dimension' && Array.isArray(param.fields) && param.fields.length > 0) {
                    const firstField = param.fields[0];
                    const firstFieldName = typeof firstField === 'string' ? firstField : firstField?.name;
                    if (firstFieldName && Object.prototype.hasOwnProperty.call(obj, firstFieldName)) {
                        obj.value = obj[firstFieldName];
                        delete obj[firstFieldName];
                    }
                }

                if (Object.keys(obj).length > 0) {
                    finalData[param.key] = obj; // <-- Attach directly at root
                }
            }
        });

        if (cleanedFormData.category === 'raw' || cleanedFormData.category === 'packing') {
            delete cleanedFormData.productType;
            delete cleanedFormData.salePrice;
        }

        return {
            ...cleanedFormData, // core product fields
            ...finalData        // flattened parameters
        };
    }

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        console.log('enabledParameters:', enabledParameters);

        // const { isValid, errors: validationErrors } = validateProductForm(formData, enabledParameters);
        // console.log('isValid:', validationErrors);
        // if (!isValid) {
        //     setErrors(validationErrors);
        //     return;
        // }
        // setErrors({});

        let payload, endpoint;
        payload = { ...formData };
        delete payload.category;
        delete payload.category_label;
        if (formData.category_label.toLowerCase() === 'raw material') {
            // Do not include 'sku' as it is handled by the database
            endpoint = '/api/raw/create';
        } else if (formData.category_label.toLowerCase() === 'packing') {
            // Do not include 'sku' as it is handled by the database
            endpoint = '/api/packing/create';
        } else {
            payload = transformFormData(payload, enabledParameters);
            endpoint = '/api/products/create';
        }

        console.log('Final API Payload:', payload, endpoint, formData.category_label);
        // return;
        try {
            let response = await axiosInstance.post(endpoint, payload);
            console.log('Response:', response);
            toast({
                type: "success",
                message: response.data.message,
                duration: 4000,
                autoClose: true,
                placement: "top-center",
                animation: "top-bottom",
            })
            router.push('/inventory'); // Redirect to inventory after creation
        } catch (error) {
            console.error('Error creating product:', error);
            toast({
                type: "error",
                message: error.response.data.message,
                duration: 4000,
                autoClose: true,
                placement: "top-center",
                animation: "top-bottom",
            })
        }
    }, [formData, router, enabledParameters]);

    // Derived paramRequirements computed with useMemo for UI hints
    const paramRequirements = useMemo(() => {
        return productParameters.reduce((acc, param) => {
            const rFields = Array.isArray(param.fields) ? param.fields : [];
            if (rFields.length > 0) {
                rFields.forEach((field) => {
                    const fname = typeof field === 'string' ? field : field?.name;
                    if (fname) {
                        acc[param.key] = acc[param.key] || Object.prototype.hasOwnProperty.call(formData, fname);
                    }
                });
            }
            if (param.unitName) {
                acc[param.key] = acc[param.key] || !!formData[param.unitName];
            }
            if (param.uniqueName) {
                acc[param.key] = acc[param.key] || !!formData[param.uniqueName];
            }
            return acc;
        }, {});
    }, [formData]);

    return (
        <Inventory>
            <h1 className="text-2xl font-bold mb-4">Create Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className='grid grid-cols-3 gap-4 grid-rows-[min-content]' >
                    <SelectTypeInput
                        placeholder="Category"
                        name="category"
                        value={formData.category_label}
                        onChange={handleChange}
                        required
                        apiget='/api/category'
                        allowCustomValue={false}
                        onSelectOption={(opt) => {
                            // opt: { label, value }    
                            dispatch({ type: 'SET_FIELD', field: 'category_label', value: opt?.label || '' });
                        }}
                    />
                    {catagory && <CoreProductFields formData={formData} onChange={handleChange} errors={errors} />}
                    <div className='col-span-3 bg-gray-100 p-4 rounded-lg flex flex-col items-start justify-start gap-2 shadow-sm'>
                        <h2 className="text-lg font-bold mb-2 flex-1/1">Product Parameters</h2>
                        <ParameterToggleBar
                            productParameters={productParameters}
                            enabledParameters={enabledParameters}
                            onToggle={toggleParameter}
                        />
                        <p className='text-gray-500'> *add parameters as per your requirement related to product</p>
                        <ProductParameters
                            enabledParameters={enabledParameters}
                            paramRequirements={paramRequirements}
                            formData={formData}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Save Product
                </button>
            </form>
        </Inventory>
    );
}