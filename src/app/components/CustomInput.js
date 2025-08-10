'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

const CustomInput = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  icon,
  className = '',
  id = '',
  ref = null,
}) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (touched && required && !value) {
      setError(`${label || name} is required`);
    } else {
      setError('');
    }
  }, [value, touched, required, label, name]);

  const handleBlur = (e) => {
    setTouched(true);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  return (
    <div className={cn(`mb-4 w-full ${className}`)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          id={id}
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className={`block w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${
            error
              ? 'focus:ring-red-500 focus:border-red-500'
              : 'focus:ring-blue-500 focus:border-blue-500'
          } sm:text-sm ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CustomInput;