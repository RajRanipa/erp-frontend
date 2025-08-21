

'use client';
import React, { memo } from 'react';

const ParameterToggleBar = ({ enabledParameters, onToggle, productParameters }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {productParameters.map((param) => (
        <button
          key={param.key}
          type="button"
          onClick={() => onToggle(param.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
            enabledParameters[param.key]
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {param.label}
        </button>
      ))}
    </div>
  );
};

export default memo(ParameterToggleBar);