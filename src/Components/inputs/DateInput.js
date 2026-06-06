'use client';
import React, { use, useEffect, useState } from 'react';
import BaseDatePicker from './BaseDatePicker';
import PresetDropdown from './PresetDropdown';
import RangePicker from './RangePicker';
import { cn } from '../../utils/cn';

// --- HELPER: Handles all the date math outside the component ---
const getPresetDateRange = (preset) => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);
  let label = '';

  const formatDate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  switch (preset) {
    // Note: 'today' logic is now handled directly in the component state,
    // so we don't need it in this switch statement anymore.
    case 'last_week':
      start.setDate(today.getDate() - 7);
      label = 'Last Week';
      break;
    case 'last_month':
      start.setMonth(today.getMonth() - 1);
      label = 'Last Month';
      break;
    case 'last_6_months':
      start.setMonth(today.getMonth() - 6);
      label = 'Last 6 Months';
      break;
    case 'last_year':
      start.setFullYear(today.getFullYear() - 1);
      label = 'Last Year';
      break;
    default:
      return null;
  }

  return {
    start: formatDate(start),
    end: formatDate(end),
    label: label,
  };
};

const BASE_PRESETS = [
  { label: 'Today / Specific Date', value: 'today' }, // Updated label for clarity
  { label: 'Last Week', value: 'last_week' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'Last Year', value: 'last_year' },
];

const DateInput = ({
  label,
  name,
  placeholder = '',
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
  error,
  info,
  autoFocus = false,
  onInpute,
  singleValue,
  mode = 'single',
  rangeValues = { start: '', end: '' },

}) => {
  // UI State
  const [displayValue, setDisplayValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);

  // NEW STATE: Track the selected preset and the specific date if "today" is chosen
  const [selectedPreset, setSelectedPreset] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  useEffect(() => {
    console.log('rangeValues', rangeValues)
    rangeValues && rangeValues.start === rangeValues.end ? setSpecificDate(rangeValues.start) : setSpecificDate('')
  },[rangeValues.start])
  const dropdownOptions =
    mode === 'range'
      ? [...BASE_PRESETS, { label: 'Custom Range', value: 'custom_range' }]
      : BASE_PRESETS;

  // --- HANDLERS ---

  const handlePresetSelect = (selectedValue) => {
    setSelectedPreset(selectedValue);

    if (selectedValue === 'custom_range') {
      setShowCustomRange(true);
      setDisplayValue('');
      return;
    }

    setShowCustomRange(false);

    // If they select 'today', switch to the specific date picker
    if (selectedValue === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setSpecificDate(todayStr);
      setDisplayValue(''); // Clear text value since we are showing the date input
      if (onChange) onChange({ start: todayStr, end: todayStr });
      return;
    }

    // Normal string presets
    const { start, end, label } = getPresetDateRange(selectedValue);
    setDisplayValue(label);
    if (onChange) onChange({ start, end });
  };

  // Handler for when they use the calendar in "Today" mode
  const handleSpecificDateChange = (newDate) => {
    setSpecificDate(newDate);
    // Send both start and end as the same date for uniform backend filtering
    if (onChange) onChange({ start: newDate, end: newDate });
  };

  const handleCustomRangeChange = (newRange) => {
    if (onChange) onChange(newRange);
  };

  const handleClearCustomRange = () => {
    setShowCustomRange(false);
    setSelectedPreset('');
    setDisplayValue('');
    if (onChange) onChange({ start: '', end: '' });
  };

  return (
    <div className={cn(`mb-5 w-full relative ${parent_className}`)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-primary-text mb-1">
          {label}
        </label>
      )}

      {/* --- MODE 1: Single Date Picker --- */}
      {mode === 'single' && (
        <BaseDatePicker
          name={name}
          value={singleValue}
          onChange={(val) => onChange && onChange(val)}
          error={error}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          icon={icon}
          autocomplete={autocomplete}
          className={className}
          id={id}
          inputRef={inputRef}
          info={info}
          autoFocus={autoFocus}
          onInpute={onInpute}
        />
      )}

      {/* --- MODE 2 & 3: Presets & Custom Range --- */}
      {mode !== 'single' && (
        <div className="relative">
          {showCustomRange ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white-400 font-medium uppercase tracking-wider">
                  Custom Range
                </span>
                <button
                  type="button"
                  onClick={handleClearCustomRange}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Back to Presets
                </button>
              </div>
              <RangePicker
                rangeValue={rangeValues}
                onRangeChange={handleCustomRangeChange}
                error={error}
                placeholder={placeholder}
                required={required}
                readOnly={readOnly}
                icon={icon}
                parent_className={parent_className}
                autocomplete={autocomplete}
                className={className}
                id={id}
                inputRef={inputRef}
                info={info}
                autoFocus={autoFocus}
                onInpute={onInpute}
              />
            </div>
          ) : (
            <PresetDropdown
              placeholder={placeholder}
              displayValue={displayValue}
              onSelect={handlePresetSelect}
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              options={dropdownOptions}
              error={error}
              // Pass the new specific date logic down
              selectedPreset={selectedPreset}
              specificDate={specificDate}
              onSpecificDateChange={handleSpecificDateChange}
              required={required}
              readOnly={readOnly}
              icon={icon}
              parent_className={parent_className}
              autocomplete={autocomplete}
              className={className}
              id={id}
              inputRef={inputRef}
              info={info}
              autoFocus={autoFocus}
              onInpute={onInpute}
            />
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-error absolute">{error}</p>
      )}
    </div>
  );
};

export default DateInput;