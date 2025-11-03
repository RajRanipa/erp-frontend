'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

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
          type={type}
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
          ${className} text-most-text 
          `)}
          tabIndex={readOnly ? -1 : undefined}
          onFocus={readOnly ? (e) => e.target.blur() : undefined}
        />
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
    </div>
  );
};

export default CustomInput;