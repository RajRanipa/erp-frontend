

// src/app/items/components/ParameterToggleBar.js
'use client';
import React, { memo } from 'react';

const ParameterToggleBar = ({ enabledParameters, onToggle, productParameters }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {productParameters.map((param) => {
        {/* console.log('param', !param.conditional, !onlyPacking); */}
          return(<button
            key={param.key}
            type="button"
            onClick={() => onToggle(param.key)}
            className={`${enabledParameters[param.key]
              ? 'btn-secondary-active'
              : 'btn- bg-white-100 text-white-600'
              }`}
          >
            {param.label}
          </button>)
      })}
    </div>
  );
};

export default memo(ParameterToggleBar);