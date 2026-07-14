'use client';
import React from 'react';
import { cn } from '../../utils/cn';

const BaseDatePicker = ({
  value,
  onChange,
  placeholder,
  error,
  disabled,
  className,
  id,
  name, 
  onBlur,
  required,
  readOnly,
  icon,
  parent_className,
  autocomplete,
  inputRef,
  info,
  autoFocus,
  onInpute,
}) => {
  return (
    <input
      type="date"
      id={id}
      name={name}
      value={value || ''}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)} // Returns "YYYY-MM-DD" directly
      disabled={disabled}
      placeholder={placeholder || ''}
      className={cn(
        `block w-full px-3 py-2 border sm:text-sm rounded-lg shadow-xs placeholder-white-400 focus:outline-none focus:border-0.5 focus:ring-3 text-most-text transition-all`,
        error
          ? 'border-error focus:ring-error focus:border-error'
          : 'border-white-200 focus:ring-blue-500/30 focus:border-blue-500',
        disabled ? 'bg-black-200 pointer-events-none' : 'bg-transparent',
        className
      )}
    />
  );
};

export default BaseDatePicker;