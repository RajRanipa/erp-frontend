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
  onBlur,
  required = false,
  readOnly = false,
  icon,
  parent_className = '',
  autocomplete = 'on',
  className = '',
  id = '',
  inputRef = null,
  err,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalErr, setInternalErr] = useState('');
  // setError(err);
  useEffect(() => {
    if (touched && required && !value) {
      setInternalErr(`${label || placeholder || name} is required`);
    }
    else {
      setInternalErr('');
    }
  }, [value, touched, required, label, name]);

  const displayErr = (typeof err === 'string' && err.length) ? err : internalErr;
  const errorId = displayErr ? `${id || name}-error` : undefined;

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  return (
    <div className={cn(`mb-5 w-full relative ${parent_className}`)}>
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
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          readOnly={readOnly}
          autoComplete={autocomplete}
          aria-invalid={!!displayErr}
          aria-describedby={errorId}
          className={cn(`${className} block w-full px-3 py-2 border sm:text-sm
          ${ displayErr ? 'border-red-500' : 'border-gray-300' } 
          rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
          ${ (displayErr && readOnly)
              ? 'focus:ring-red-500 focus:border-red-500'
              : 'focus:ring-blue-500 focus:border-blue-500' } 
          ${readOnly ? 'bg-gray-200 pointer-events-none' : ''} 
               ${icon ? 'pl-10' : ''}`)}
        />
      </div>
        {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-red-600 absolute">{displayErr}</p>}
    </div>
  );
};

export default CustomInput;