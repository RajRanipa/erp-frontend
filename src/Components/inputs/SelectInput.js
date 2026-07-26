'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const SelectInput = ({
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
  options = [],
  btnContent,
  info,
  autoFocus = false,
  min,
  max,
  onInpute,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalErr, setInternalErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // setError(err);
  useEffect(() => {
    if (touched && required && !value) {
      setInternalErr(`${label || placeholder || name} is required`);
    }
    else {
      setInternalErr('');
    }
  }, [value, touched, required, label, name, placeholder]);

  const displayErr = (typeof err === 'string' && err.length) ? err : internalErr;
  const errorId = displayErr ? `${id || name}-error` : undefined;

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  const effectiveType = (type === 'password' && showPassword) ? 'text' : type;

  return (
    <div className={cn(`mb-5 w-full relative ${parent_className}`)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-primary-text mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center gap-2">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white-300">
            {icon}
          </div>
        )}
        <select
          type={effectiveType}
          name={name}
          id={id ? id : name}
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
          className={cn(` text-most-text  block w-full px-3 py-2 border sm:text-sm
          ${displayErr ? 'border-error' : 'border-white-200'} 
          rounded-lg shadow-xs placeholder-white-400 focus:outline-none
          focus:border-0.5 focus:ring-3
          ${(displayErr && readOnly)
              ? 'focus:ring-error focus:ring-3 focus:border-error focus:border-0.5 '
              : 'focus:ring-blue-500/30  focus:border-blue-500 focus:border-0.5'} 
          ${readOnly ? 'bg-black-200 pointer-events-none' : ''} 
               ${icon ? 'pl-10' : ''}
          ${type === 'password' ? 'pr-10' : ''}
          ${className} 
          `)}
          tabIndex={readOnly ? -1 : undefined}
          onFocus={readOnly ? (e) => e.target.blur() : undefined}
          autoFocus={autoFocus}
          {...(type === 'number' ? { min, max, inputMode: 'decimal' } : {})}
          onInput={(e) => onInpute?.(e)}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-900"> {/* this was hidden before */}
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>}
      {readOnly && info && <p id={errorId} className="mt-1 text-sm text-white-500 absolute">{info}</p>}
    </div>
  );
};

export default SelectInput;