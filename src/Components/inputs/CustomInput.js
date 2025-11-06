'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { eyeHideIcon, eyeShowIcon} from '@/utils/SVG';

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
  onBtnClick,
  btnContent,
  info,
  autoFocus=false,
  min,
  max,
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
        <input
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
          className={cn(` block w-full px-3 py-2 border sm:text-sm
          ${ displayErr ? 'border-error' : 'border-white-100' } 
          rounded-lg shadow-sm placeholder-white-400 focus:outline-none focus:ring-2 
          ${ (displayErr && readOnly)
              ? 'focus:ring-error focus:border-error'
              : 'focus:ring-blue-500 focus:border-blue-500' } 
          ${readOnly ? 'bg-black-200 pointer-events-none' : ''} 
               ${icon ? 'pl-10' : ''}
          ${ type === 'password' ? 'pr-10' : '' }
          ${className} text-most-text 
          `)}
          tabIndex={readOnly ? -1 : undefined}
          onFocus={readOnly ? (e) => e.target.blur() : undefined}
          autoFocus={autoFocus}
          {...(type === 'number' ? { min, max, inputMode: 'decimal' } : {})}
        />
        
  {type === 'password' && !readOnly && (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white-600 focus:outline-none"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {showPassword ? (
        // eye closed (slash) icon
        <>{eyeHideIcon()}</>
      ) : (
        // eye open icon
       <>{eyeShowIcon()}</>
      )}
    </button>
  )}

        {(onBtnClick || btnContent) && (
          <button
            type="button"
            onClick={onBtnClick}
            className="btn-secondary"
          >
            {btnContent}
          </button>
        )}
      </div>
        {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>}
      {readOnly && info && <p id={errorId} className="mt-1 text-sm text-white-500 absolute">{info}</p>}
    </div>
  );
};

export default CustomInput;