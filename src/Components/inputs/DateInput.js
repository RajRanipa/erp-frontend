'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { downArrow, eyeHideIcon, eyeShowIcon, upArrow } from '@/utils/SVG';

const DateInput = ({
  label,
  name,
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
  info,
  autoFocus = false,
  onInpute,
  mode = 'single', // 'single' | 'range'
  preset = null,   // 'today' | 'last_week' | 'last_month' | 'last_6_months' | 'last_year'
  rangeValue = { start: '', end: '' },
  onRangeChange,
  onLabelChange,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalErr, setInternalErr] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const dropdownRef = React.useRef(null);
  const listRef = React.useRef(null);
  const dropdownHeight = 'max-h-52';
  // setError(err);
  useEffect(() => {
    if (touched && required && !value) {
      setInternalErr(`${label || placeholder || name} is required`);
    }
    else {
      setInternalErr('');
    }
  }, [value, touched, required, label, name, placeholder]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!preset) return;
    setSelectedPreset(preset);
    setIsCustomRange(false);

    const presetLabelMap = {
      today: 'Today',
      last_week: 'Last Week',
      last_month: 'Last Month',
      last_6_months: 'Last 6 Months',
      last_year: 'Last Year',
    };

    onLabelChange?.(presetLabelMap[preset] || '');

    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = end = today;
        break;
      case 'last_week':
        start.setDate(today.getDate() - 7);
        break;
      case 'last_month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'last_6_months':
        start.setMonth(today.getMonth() - 6);
        break;
      case 'last_year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return;
    }

    const formatDate = (d) => d.toISOString().split('T')[0];

    if (mode === 'single' && onChange) {
      onChange({ target: { name, value: formatDate(end) } });
    }

    if (mode === 'range' && onRangeChange) {
      onRangeChange({
        start: formatDate(start),
        end: formatDate(end),
      });
    }
  }, [preset]);

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
        <button className="absolute inset-y-0 left-0 pl-3 flex items-center text-white-300 z-90" onClick={(e) => {
          e.stopPropagation();
          setShowDropdown((prev) => !prev);
        }}>
          {showDropdown ? upArrow() : downArrow()}
        </button>

        {(mode === 'single' || (mode === 'range' && !isCustomRange)) && (
          <>
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white-300">
                {icon}
              </div>
            )}

            <input
              type={
                mode === 'range' && !isCustomRange
                  ? 'text'
                  : selectedPreset === 'today'
                  ? 'date'
                  : 'text'
              }
              name={name}
              id={id ? id : name}
              ref={inputRef}
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              required={required}
              readOnly={
                readOnly ||
                (mode === 'range' && !isCustomRange) ||
                selectedPreset !== 'today'
              }
              autoComplete={autocomplete}
              aria-invalid={!!displayErr}
              aria-describedby={errorId}
              className={cn(` block w-full px-3 py-2 border sm:text-sm
              ${displayErr ? 'border-error' : 'border-white-200'} 
              rounded-lg shadow-xs placeholder-white-400 focus:outline-none
              focus:border-0.5 focus:ring-3
              ${(displayErr && readOnly)
                  ? 'focus:ring-error focus:ring-3 focus:border-error focus:border-0.5 '
                  : 'focus:ring-blue-500/30  focus:border-blue-500 focus:border-0.5'} 
              ${readOnly ? 'bg-black-200 pointer-events-none' : ''} 
                   ${icon ? 'pl-20' : 'pl-10'}
              ${className} text-most-text 
              `)}
              tabIndex={readOnly ? -1 : undefined}
              onFocus={(e) => {
                if (readOnly) {
                  e.target.blur();
                } else {
                  setShowDropdown(true);
                }
              }}
              autoFocus={autoFocus}
              onInput={(e) => onInpute?.(e)}
            />

          </>
        )}

        {mode === 'range' && isCustomRange && (
          <>
            <input
              type="date"
              value={rangeValue.start}
              onChange={(e) =>
                onRangeChange?.({ ...rangeValue, start: e.target.value })
              }
              className={cn(` block w-full px-3 py-2 border sm:text-sm
              border-white-200 rounded-lg shadow-xs focus:outline-none
              focus:ring-blue-500/30 focus:border-blue-500 ${className}
              ${icon ? 'pl-20' : 'pl-10'}`)}
            />
            <span className="text-white-400">to</span>
            <input
              type="date"
              value={rangeValue.end}
              onChange={(e) =>
                onRangeChange?.({ ...rangeValue, end: e.target.value })
              }
              className={cn(` block w-full px-3 py-2 border sm:text-sm
              border-white-200 rounded-lg shadow-xs focus:outline-none
              focus:ring-blue-500/30 focus:border-blue-500 ${className}`)}
            />
          </>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-90 rounded-lg w-full" ref={dropdownRef}>
          <div
            className={cn(
              'mb-5 mt-1 bg-black-200 border border-white-200 overflow-hidden shadow-lg rounded-lg backdrop-blur-2xl',
              dropdownHeight
            )}
          >
            <ul className={cn('overflow-y-auto w-full p-1.5', dropdownHeight)} ref={listRef}>
              {[
                { label: 'Today', value: 'today' },
                { label: 'Last Week', value: 'last_week' },
                { label: 'Last Month', value: 'last_month' },
                { label: 'Last 6 Months', value: 'last_6_months' },
                { label: 'Last Year', value: 'last_year' },
                ...(mode === 'range'
                  ? [{ label: 'Custom Range', value: 'custom_range' }]
                  : []),
              ].map((item) => (
                <li
                  key={item.value}
                  className="px-3 py-2 hover:bg-black-300 rounded cursor-pointer"
                  onClick={() => {
                    setShowDropdown(false);
                    setSelectedPreset(item.value);

                    if (item.value === 'custom_range') {
                      setIsCustomRange(true);
                      onLabelChange?.('');
                      return;
                    }

                    // reset custom range if user selects preset again
                    setIsCustomRange(false);
                    onLabelChange?.(item.label);

                    const event = { target: { name, value: item.value } };
                    // trigger preset manually
                    if (mode === 'single' && onChange) {
                      const today = new Date();
                      let start = new Date();
                      let end = new Date();

                      switch (item.value) {
                        case 'today':
                          start = end = today;
                          break;
                        case 'last_week':
                          start.setDate(today.getDate() - 7);
                          break;
                        case 'last_month':
                          start.setMonth(today.getMonth() - 1);
                          break;
                        case 'last_6_months':
                          start.setMonth(today.getMonth() - 6);
                          break;
                        case 'last_year':
                          start.setFullYear(today.getFullYear() - 1);
                          break;
                      }

                      const formatDate = (d) => d.toISOString().split('T')[0];
                      onChange({ target: { name, value: formatDate(end) } });
                    }

                    if (mode === 'range' && onRangeChange) {
                      const today = new Date();
                      let start = new Date();
                      let end = new Date();

                      switch (item.value) {
                        case 'today':
                          start = end = today;
                          break;
                        case 'last_week':
                          start.setDate(today.getDate() - 7);
                          break;
                        case 'last_month':
                          start.setMonth(today.getMonth() - 1);
                          break;
                        case 'last_6_months':
                          start.setMonth(today.getMonth() - 6);
                          break;
                        case 'last_year':
                          start.setFullYear(today.getFullYear() - 1);
                          break;
                      }

                      const formatDate = (d) => d.toISOString().split('T')[0];
                      onRangeChange({
                        start: formatDate(start),
                        end: formatDate(end),
                      });
                    }
                  }}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>}
      {readOnly && info && <p id={errorId} className="mt-1 text-sm text-white-500 absolute">{info}</p>}
    </div>
  );
};

export default DateInput;