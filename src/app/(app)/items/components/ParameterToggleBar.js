

// src/app/items/components/ParameterToggleBar.js
'use client';
import React, { memo } from 'react';

const ParameterToggleBar = ({
  enabledParameters,
  requiredParameters = [],
  onToggle,
  productParameters,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {productParameters.map((param) => {
        const required = requiredParameters.includes(param.key);
        return (<button
            key={param.key}
            type="button"
            onClick={() => onToggle(param.key)}
            disabled={required}
            aria-pressed={Boolean(enabledParameters[param.key])}
            title={required ? `${param.label} is required` : undefined}
            className={`${enabledParameters[param.key]
              ? 'btn-secondary-active'
              : 'btn- bg-white-100 text-white-600'
              } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {param.label}{required ? ' *' : ''}
          </button>)
      })}
    </div>
  );
};

export default memo(ParameterToggleBar);
