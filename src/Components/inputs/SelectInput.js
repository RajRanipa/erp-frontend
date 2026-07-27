'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';
import { downArrow } from '@/utils/SVG';

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
  disabled = false,
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
  const clearBtnRef = useRef(null);
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

  const clearSelection = useCallback((e) => {
    onChange(e);
    if (required) inputRef.current.focus();
  }, [onChange, required, inputRef]);

  return (
    <div className={cn('relative mb-5 w-full', parent_className)}>
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
          disabled={disabled}
          autoComplete={autocomplete}
          aria-invalid={!!displayErr}
          aria-describedby={errorId}
          // AFTER
          className={cn(`appearance-none block w-full px-3 py-2 border sm:text-sm
            ${!value ? 'text-white-400' : 'text-most-text'} 
            ${displayErr ? 'border-error' : 'border-white-200'} 
            rounded-lg shadow-xs focus:outline-none focus:border-0.5 focus:ring-3
            ${(displayErr && readOnly)
                        ? 'focus:ring-error focus:ring-3 focus:border-error focus:border-0.5 '
                        : 'focus:ring-blue-500/30  focus:border-blue-500 focus:border-0.5'} 
            ${readOnly || disabled ? 'bg-black-200 pointer-events-none opacity-75' : ''}
            ${icon ? 'pl-10' : ''}
            ${type === 'password' ? 'pr-10' : ''}
            ${className} 
          `)}
          tabIndex={readOnly || disabled ? -1 : undefined}
          onFocus={readOnly ? (e) => e.target.blur() : undefined}
          autoFocus={autoFocus}
          {...(type === 'number' ? { min, max, inputMode: 'decimal' } : {})}
          onInput={(e) => onInpute?.(e)}
        >
          {placeholder && (
            <option value="" disabled> {/* this was hidden before */}
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}

        </select>
        {(
          value && !readOnly ? (
            <button
              type="button"
              aria-label="Clear selection"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-md text-white-300 scale-90 hover:text-white-700 w-[20px] h-[20px] flex justify-center items-center"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearSelection}
              ref={clearBtnRef}
              tabIndex={0}
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-white-300 scale-75 pointer-events-none flex justify-center items-center">
              {downArrow()}
            </span>
          )
        )}
      </div>
      {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>}
      {readOnly && info && <p id={errorId} className="mt-1 text-sm text-white-500 absolute">{info}</p>}
    </div>
  );
};

export default SelectInput;
