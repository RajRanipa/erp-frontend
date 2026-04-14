'use client';
import React from 'react';
import { cn } from '../../utils/cn';

const RangePicker = ({
  rangeValue, onRangeChange, error, className, placeholder,
  required,
  readOnly,
  icon,
  parent_className,
  autocomplete,
  id,
  inputRef,
  info,
  autoFocus,
  onInpute,
}) => {
  const baseInputClass = `block w-full px-3 py-2 border sm:text-sm rounded-lg shadow-xs focus:outline-none focus:border-0.5 focus:ring-3 text-most-text bg-transparent transition-all`;

  const stateClass = error
    ? 'border-error focus:ring-error focus:border-error'
    : 'border-white-200 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <input
        type="date"
        value={rangeValue?.start || ''}
        onChange={(e) => onRangeChange({ ...rangeValue, start: e.target.value })}
        className={cn(baseInputClass, stateClass)}
        placeholder={placeholder || 'Start Date'}
      />

      <span className="text-white-400 text-sm font-medium">to</span>

      <input
        type="date"
        value={rangeValue?.end || ''}
        onChange={(e) => onRangeChange({ ...rangeValue, end: e.target.value })}
        className={cn(baseInputClass, stateClass)}
        placeholder={placeholder || 'End Date'}
      />
    </div>
  );
};

export default RangePicker;