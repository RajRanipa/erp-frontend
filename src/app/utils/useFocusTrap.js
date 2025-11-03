'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { axiosInstance } from '@/lib/axiosInstance'

const normalizeOption = (item) => {
  if (item == null) return null;
  if (typeof item === 'string') return { label: item, value: item };
  if (typeof item === 'object') {
    if ('label' in item && 'value' in item) return { label: String(item.label), value: String(item.value) };
    if ('value' in item) return { label: String(item.value), value: String(item.value) };
    if ('name' in item && 'id' in item) return { label: String(item.name), value: String(item.id) };
    // fallback: first truthy stringy prop becomes label+value
    const first = Object.values(item).find(v => typeof v === 'string' && v.trim());
    return { label: String(first ?? ''), value: String(first ?? '') };
  }
  return { label: String(item), value: String(item) };
};

const SelectTypeInput = ({
  type='text', 
  label,
  name,
  placeholder = '',
  options: optionsProp = [], // array of strings or objects
  value,
  onChange,
  required = false,
  readOnly = false,
  parent_className = '',
  className = '',
  allowCustomValue = false,
  apiget,
  apipost,
  callBack,
  buttonName,
}) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(''); // what user sees (label)
  const [selectedValue, setSelectedValue] = useState(value ?? ''); // what we send (value)
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [options, setOptions] = useState((optionsProp || []).map(normalizeOption).filter(Boolean));
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const rootRef = React.useRef(null);

  // Guard to avoid double-fetch in React StrictMode (dev)
  const didFetchRef = React.useRef(false);

  useEffect(() => {
    // find label for the incoming value
    if (selectedValue && options.length) {
      const found = options.find(o => String(o.value) === String(selectedValue));
      if (found) setInputValue(found.label);
    } else if (!selectedValue) {
      // if no value, keep input as-is or empty
      setInputValue('');
    }
  }, [selectedValue, options]);

  // Fetch options from backend if apiget is provided and optionsProp is not set or empty
  useEffect(() => {
    let ignore = false;
    const toNormalized = (arr) => (arr || []).map(normalizeOption).filter(Boolean);

    const fetchOptions = async () => {
      if (apiget) {
        try {
          console.log("apiget",apiget)
          const res = await axiosInstance.get(apiget);
          console.log("res",res)

          if (!ignore && Array.isArray(res.data)) {
            setOptions(toNormalized(res.data));
          }
        } catch (err) {
          if (!ignore) setOptions([]);
        }
      } else if (optionsProp && optionsProp.length) {
        setOptions((optionsProp || []).map(normalizeOption).filter(Boolean));
      }
    };

    // StrictMode in dev mounts twice -> guard repeated call

    fetchOptions();

    return () => { ignore = true; };
  }, []); // run once on mount

  useEffect(() => {
    if (touched && required && !inputValue) {
      setError(`${label || placeholder || name} is required`);
    } else {
      setError('');
    }
  }, [inputValue, touched, required, label, name]);

  const handleBlur = (e) => {
    setTouched(true);
    // If focus is moving to an element inside this component (button/menu), do not reject
    const next = e?.relatedTarget;
    if (rootRef.current && next && rootRef.current.contains(next)) {
      console.log(rootRef.current)
      console.log(next)
      console.log(rootRef.current.contains(next))
      return;
    }

    setShowOptions(false);
    if (!allowCustomValue) {
      console.log(next)
      const exact = options.find(opt => opt.label === inputValue);
      if (!exact) {
        setInputValue('');
        setSelectedValue('');
        if (onChange) onChange({ target: { name, value: '' } });
      } else {
        setSelectedValue(exact.value);
        if (onChange) onChange({ target: { name, value: exact.value } });
      }
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (!allowCustomValue) {
      const filtered = val.trim()
        ? options.filter(opt => opt.label.toLowerCase().includes(val.toLowerCase()))
        : options;
      setFilteredOptions(filtered);
      setShowOptions(true);
      setHighlightedIndex(filtered.length ? 0 : null);
      setInputValue(val);
      const exact = options.find(opt => opt.label === val);
      setSelectedValue(exact ? exact.value : '');
      if (onChange) onChange({ target: { name, value: exact ? exact.value : '' } });
    } else {
      setInputValue(val);
      setCreated(false);
      // In allowCustomValue mode, value defaults to the raw text unless an option is chosen
      setSelectedValue(val);
      if (onChange) onChange({ target: { name, value: val } });
      if (val.trim()) {
        setFilteredOptions(
          options.filter(opt => opt.label.toLowerCase().includes(val.toLowerCase()))
        );
      } else {
        setFilteredOptions(options);
      }
      setShowOptions(true);
      setHighlightedIndex(0);
    }
  };

  const handleSelect = (option) => {
    setInputValue(option.label);
    setSelectedValue(option.value);
    if (onChange) onChange({ target: { name, value: option.value } });
    setShowOptions(false);
    setHighlightedIndex(null);
    setFilteredOptions(options);
  };

  const handleFocus = () => {
    if (options.length > 0) {
      setFilteredOptions(options);
      setShowOptions(true);
      setHighlightedIndex(0);
    }
  };

  const handleKeyDown = (e) => {
    if (!showOptions || filteredOptions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev === null || prev === filteredOptions.length - 1) return 0;
        return prev + 1;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev === null || prev === 0) return filteredOptions.length - 1;
        return prev - 1;
      });
    } else if (e.key === 'Enter') {
      if (highlightedIndex !== null && filteredOptions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  // Helper: should show create button (works with apipost or callBack)
  const hasCreator = Boolean(apipost) || typeof callBack === 'function';
  const shouldShowCreateButton =
    hasCreator &&
    inputValue.trim() &&
    !options.some(opt => opt.label.toLowerCase().trim().includes(inputValue.toLowerCase().trim())) && // hey don't change this line i want this also do don't change at all 
    !created;

  // Create & Save handler
  const handleCreateAndSave = async () => {
    // Debug: confirm button click triggers
    console.log('SelectTypeInput.handleCreateAndSave clicked', { name, inputValue, selectedValue, hasCreator: Boolean(apipost) || typeof callBack === 'function' });

    if (typeof callBack === 'function') {
      console.log('SelectTypeInput: invoking callBack', { name, label: inputValue, value: selectedValue || inputValue });
      try {
        callBack({ name, label: inputValue, value: selectedValue || inputValue });
      } catch (e) {
        console.error('SelectTypeInput: callBack threw', e);
      }
      return;
    }
    if (!apipost || !inputValue) return;
    setLoading(true);
    setError('');
    try {
      const payload = { [name]: selectedValue || inputValue };
      await axiosInstance.post(apipost, payload);

      let newOptions = options;
      if (apiget) {
        try {
          const res = await axiosInstance.get(apiget);
          if (Array.isArray(res.data)) {
            newOptions = res.data.map(normalizeOption).filter(Boolean);
            setOptions(newOptions);
          }
        } catch {
          const newOpt = normalizeOption({ label: inputValue, value: selectedValue || inputValue });
          if (!newOptions.some(o => String(o.value) === String(newOpt.value))) {
            newOptions = [...newOptions, newOpt];
            setOptions(newOptions);
          }
        }
      } else {
        const newOpt = normalizeOption({ label: inputValue, value: selectedValue || inputValue });
        if (!newOptions.some(o => String(o.value) === String(newOpt.value))) {
          newOptions = [...newOptions, newOpt];
          setOptions(newOptions);
        }
      }

      // Lock selection to the created option
      const createdOpt = options.find(o => o.label === inputValue) || { label: inputValue, value: selectedValue || inputValue };
      setInputValue(createdOpt.label);
      setSelectedValue(createdOpt.value);
      if (onChange) onChange({ target: { name, value: createdOpt.value } });

      setCreated(true);
      setShowOptions(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create and save');
    }
    setLoading(false);
  };

  return (
    options.length > 0 &&
    <div ref={rootRef} className={cn(`mb-5 w-full relative ${parent_className}`)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-primary-text mb-1"
        >
          {label} {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type={type}
            name={name}
            value={loading ? (inputValue || '') : inputValue}
            placeholder={loading ? 'Saving...' : placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            autoComplete="off"
            disabled={loading}
            className={cn(`${className} block w-full px-3 py-2 border sm:text-sm
              ${error ? 'border-error' : 'border-color'}
              rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2
              ${error ? 'focus:ring-error focus:border-error'
                : 'focus:ring-blue-500 focus:border-blue-500'}
              ${readOnly ? 'bg-secondary pointer-events-none' : ''}
              ${loading ? 'bg-gray-100 text-gray-400' : ''}
            `)}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              <svg className="animate-spin h-4 w-4 inline mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Saving...
            </span>
          )}
        </div>
        {shouldShowCreateButton && (
          <button
            type="button"
            className="ml-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
            onClick={() => handleCreateAndSave()}
            onMouseDown={(e) => e.preventDefault()} // this is neccessary so just don't remove it okay nice and easy 
            disabled={loading}
            onBlur={handleBlur}
            // tabIndex={1}
          >
            {loading ? 'Saving...' : (buttonName ? buttonName : 'Create & Save')}
          </button>
        )}
      </div>

      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 bg-most-secondary border border-color-100 rounded-lg shadow-md mt-1 max-h-40 overflow-y-auto w-full">
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className={cn(
                "px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm",
                idx === highlightedIndex ? "bg-blue-100" : ""
              )}
              onMouseDown={() => handleSelect(option)}
              ref={el => {
                if (idx === highlightedIndex && el) {
                  el.scrollIntoView({ block: 'nearest' });
                }
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-sm text-error absolute">{error}</p>}
    </div>
  );
};

export default SelectTypeInput;