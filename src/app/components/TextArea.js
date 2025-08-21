import React, { useState, forwardRef } from 'react';

const TextArea = forwardRef(({
  label,
  name,
  placeholder,
  value,
  onChange,
  required,
  icon,
  className = '',
  id,
  rows = 3,
}, ref) => {
  const [touched, setTouched] = useState(false);

  const showError = required && touched && !value;

  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block mb-1 font-medium text-gray-700">
          {label}{required && <span className="text-red-500">*</span>}
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
          className={`block w-full rounded-md border shadow-sm px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-y
            ${icon ? 'pl-10' : ''}
            ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
        />
      </div>
      {showError && (
        <p className="mt-1 text-sm text-red-600">This field is required.</p>
      )}
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea;
