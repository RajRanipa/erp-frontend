// src/utils/validateProductForm.js
import { productParameters } from '../config/productConfig';

/**
 * Validates product form data based on enabled parameters and configuration
 * @param {Object} formData - The form state object containing all product data
 * @param {Object} enabledParameters - Object mapping parameter keys to boolean (enabled/disabled)
 * @returns {{isValid: boolean, errors: Object}} - Validation result and error messages
 */
export default function validateProductForm(formData, enabledParameters) {
  const errors = {};

  for (const param of productParameters) {
    if (!enabledParameters[param.key]) continue;

    // Validate parameter fields
    if (param.fields && param.fields.length > 0) {
      for (const field of param.fields) {
        if (
          !formData[field.name] ||
          formData[field.name].toString().trim() === ''
        ) {
          errors[field.name] = `${field.placeholder || field.name} is required for ${param.label}`;
        }
      }
    }

    // Validate unit
    if (param.unitName) {
      if (
        !formData[param.unitName] ||
        formData[param.unitName].toString().trim() === ''
      ) {
        errors[param.unitName] = `Unit is required for ${param.label}`;
      }
    }

    // Validate unique flag
    if (param.uniqueName) {
      if (
        !formData[param.uniqueName] ||
        formData[param.uniqueName].toString().trim() === ''
      ) {
        errors[param.uniqueName] = `Unique selection is required for ${param.label}`;
      }
    }
  }

  // Basic core fields validation (optional, can be moved to config)
  if (!formData.productName || formData.productName.trim() === '') {
    errors.productName = 'Product name is required';
  }
  // if (!formData.productType || formData.productType.trim() === '') {
  //   errors.productType = 'Product type is required';
  // }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}