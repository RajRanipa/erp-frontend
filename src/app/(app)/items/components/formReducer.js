

// src/app/items/components/formReducer.js
import { productParameters } from '@/config/productConfig';
export const formReducer = (state, action) => {
  console.log('formReducer action:', action.type, action);
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

export default formReducer;