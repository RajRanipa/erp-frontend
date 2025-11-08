import React, { useState, forwardRef } from 'react';
import { cn } from '../../utils/cn';

const TextArea = forwardRef(({
  label,
  name,
  placeholder,
  value,
  onChange,
  required,
  icon,
  parentClass = '',
  className = '',
  id,
  rows = 3,
}, ref) => {
  const [touched, setTouched] = useState(false);

  const showError = required && touched && !value;

  // on change i want to set height of textarea to fit content 
  return (
    <div className={`mb-5 w-full ${parentClass}`}>
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-primary-text mb-1">
          {label}{required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <textarea
          id={id || name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          required={required}
          ref={ref}
          rows={rows}
          className={cn(`block w-full rounded-lg border shadow-sm px-3 py-2 text-most-text focus:outline-none focus:border-0.5 focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 sm:text-sm resize-y
            ${className}
            ${icon ? 'pl-10' : ''}
            ${showError ? 'border-error focus:ring-error/30 focus:border-error' : 'border-white-100'}
          `)}
        />
      </div>
      {showError && (
        <p className="mt-1 text-sm text-error">This field is required.</p>
      )}
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea;
