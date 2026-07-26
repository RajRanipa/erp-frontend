import { productParameters } from '../../../../config/productConfig';

export const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_FIELDS':
      return { ...state, ...(action.fields || {}) };

    case 'CHANGE_PRODUCT_TYPE': {
      const nextState = { ...state };
      for (const field of ['dimension', 'density', 'temperature', 'packing']) {
        delete nextState[field];
      }
      nextState.productType = action.value;
      nextState.productType_label = action.label || '';
      return nextState;
    }

    case 'TOGGLE_PARAMETER': {
      const parameter = productParameters.find(item => item.key === action.key);
      if (!parameter) return state;

      if (action.enabled) {
        return {
          ...state,
          [parameter.key]: state[parameter.key] ?? '',
        };
      }

      const nextState = { ...state };
      delete nextState[parameter.key];
      return nextState;
    }

    case 'RESET_FORM':
      return action.initialState || {};

    default:
      return state;
  }
};

export default formReducer;
