'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { cn } from '../utils/cn';
import { axiosInstance } from '../../lib/axiosInstance'

const normalizeOption = (item) => {
  console.log("it's called and active ", item)
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

const chekobject = (item) => {
  if (Array.isArray(item)) {
    if (item.length === 0) return [];
    if (!item[0].value && !item[0].label) {
      return item.map(normalizeOption).filter(Boolean);
    }
    if (item[0].value && item[0].label) {
      return item;
    }
    // fallback: normalize everything
    return item.map(normalizeOption).filter(Boolean);
  }
  return [];
};

const setIfChanged = (setter, current, next) => {
  if (current !== next) setter(next);
};

const SelectTypeInput = ({
  id,
  type = 'text',
  label,
  name,
  placeholder = '',
  options: optionsProp, // array of strings or objects
  value,
  onChange,
  required = false,
  readOnly = false,
  parent_className = '',
  className = '',
  allowCustomValue = false,
  apiget,
  apiparams = "by-id",
  apipost,
  params,
  callBack,
  buttonName,
  onSelectOption,
}) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(''); // what user sees (label)
  const [selectedValue, setSelectedValue] = useState(value ?? ''); // what we send (value)
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [options, setOptions] = useState(optionsProp || [])
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const rootRef = React.useRef(null);

  // Guard to avoid double-fetch in React StrictMode (dev)
  const didFetchRef = React.useRef(false);

  useEffect(() => {
    // Sync input from selected value only when selectedValue/options change,
    // not on every keystroke (avoids wiping user typing).
    if (selectedValue && options.length) {
      const found = options.find(o => String(o.value) === String(selectedValue));
      if (found) setIfChanged(setInputValue, inputValue, found.label);
    } else if (!selectedValue) {
      // Clear only on mount/prop changes, not on typing
      if (inputValue !== '') setIfChanged(setInputValue, inputValue, '');
    }
  }, [selectedValue, options, inputValue]);

  // Fetch options from backend. If `params` has filters, pass them; otherwise fetch all.
  useEffect(() => {
    let ignore = false;

    const fetchOptions = async () => {
      if (!apiget) {
        // Fallback to provided optionsProp when no apiget
        if (optionsProp && optionsProp.length) {
          const norm = chekobject(optionsProp || []);
          setOptions(norm);
          setFilteredOptions(norm);
        }
        return;
      }

      try {
        const queryParams = {};
        if (params?.productType) queryParams.productType = params.productType;
        if (params?.category) queryParams.category = params.category;

        const hasFilters = Object.keys(queryParams).length > 0;
        const base = (apiget || '').replace(/\/+$/, ''); // trim trailing /
        const suffix = (apiparams || '').replace(/^\/+/, ''); // trim leading /
        const needsAppend = hasFilters && suffix && !base.endsWith(`/${suffix}`);
        const url = needsAppend ? `${base}/${suffix}` : base;

        console.log('SelectTypeInput.fetchOptions', { url, queryParams });

        const res = await axiosInstance.get(url, hasFilters ? { params: queryParams } : undefined);

        if (!ignore && Array.isArray(res.data)) {
          const norm = chekobject(res.data);
          setOptions(norm);
          setFilteredOptions(norm);
        }
      } catch (err) {
        console.error('SelectTypeInput.fetchOptions error', err);
        if (!ignore) {
          setOptions([]);
          setFilteredOptions([]);
        }
      }
    };

    fetchOptions();
    return () => { ignore = true; };
  }, [apiget, apiparams, optionsProp, params?.productType, params?.category]);

  useEffect(() => {
    if (touched && required && !inputValue) {
      setError(`${label || placeholder || name} is required`);
    } else {
      setError('');
    }
  }, [inputValue, touched, required, label, name, placeholder]);

  const handleBlur = useCallback((e) => {
    setTouched(true);
    // If focus is moving to an element inside this component (button/menu), do not reject
    const next = e?.relatedTarget;
    if (rootRef.current && next && rootRef.current.contains(next)) return;

    setShowOptions(false);
    if (!allowCustomValue) {
      const exact = options.find(opt => opt.label === inputValue);
      if (!exact) {
        setIfChanged(setInputValue, inputValue, '');
        setIfChanged(setSelectedValue, selectedValue, '');
        if (onChange) onChange({ target: { name, value: '' } });
        onSelectOption?.(null);
      } else {
        setIfChanged(setSelectedValue, selectedValue, exact.value);
        if (onChange) onChange({ target: { name, value: exact.value } });
        onSelectOption?.(exact);
      }
    }
  }, [allowCustomValue, inputValue, name, onChange, options, selectedValue, onSelectOption]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    if (!allowCustomValue) {
      const filtered = val.trim()
        ? options.filter(opt => opt.label.toLowerCase().includes(val.toLowerCase()))
        : options;
      setFilteredOptions(filtered);
      setShowOptions(true);
      setHighlightedIndex(filtered.length ? 0 : null);
      setIfChanged(setInputValue, inputValue, val);
      const exact = options.find(opt => opt.label === val);
      setIfChanged(setSelectedValue, selectedValue, exact ? exact.value : val);
      if (onChange) onChange({ target: { name, value: exact ? exact.value : '' } });
      if (exact) {
        onSelectOption?.(exact);
      } else {
        onSelectOption?.(null);
      }
    } else {
      setIfChanged(setInputValue, inputValue, val);
      setCreated(false);
      // In allowCustomValue mode, value defaults to the raw text unless an option is chosen
      setIfChanged(setSelectedValue, selectedValue, val);
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
  }, [allowCustomValue, inputValue, name, onChange, options, selectedValue, onSelectOption]);

  const handleSelect = useCallback((option) => {
    setIfChanged(setInputValue, inputValue, option.label);
    setIfChanged(setSelectedValue, selectedValue, option.value);
    if (onChange) {
      onChange({ target: { name, value: option.value } });
      onSelectOption?.(option); // Call the onSelectOption prop
    }
    setShowOptions(false);
    setHighlightedIndex(null);
    setFilteredOptions(options);
  }, [inputValue, name, onChange, options, selectedValue, onSelectOption]);

  const handleFocus = useCallback(() => {
    if (options.length > 0) {
      setFilteredOptions(options);
      setShowOptions(true);
      setHighlightedIndex(0);
    }
  }, [options]);

  const handleKeyDown = useCallback((e) => {
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
  }, [filteredOptions, highlightedIndex, showOptions, handleSelect]);

  // Helper: should show create button (works with apipost or callBack)
  const hasCreator = Boolean(apipost) || typeof callBack === 'function';
  const shouldShowCreateButton =
    hasCreator &&
    inputValue.trim() &&
    !options.some(opt => opt.label.toLowerCase().trim().includes(inputValue.toLowerCase().trim())) && // hey don't change this line i want this also do don't change at all 
    !created;

  // Create & Save handler
  const handleCreateAndSave = useCallback(async () => {
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
          setOptions(chekobject(res.data));
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
      setIfChanged(setInputValue, inputValue, createdOpt.label);
      setIfChanged(setSelectedValue, selectedValue, createdOpt.value);
      if (onChange) onChange({ target: { name, value: createdOpt.value } });

      setCreated(true);
      setShowOptions(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create and save');
    }
    setLoading(false);
  }, [apiget, apipost, callBack, inputValue, name, onChange, options, selectedValue]);

  return (
    <div ref={rootRef} className={cn(`mb-5 w-full relative ${parent_className}`)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            id={id}
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
              ${error ? 'border-red-500' : 'border-gray-300'}
              rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2
              ${error ? 'focus:ring-red-500 focus:border-red-500'
                : 'focus:ring-blue-500 focus:border-blue-500'}
              ${readOnly ? 'bg-gray-200 pointer-events-none' : ''}
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
            className="ml-2 px-3 py-2 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
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
        <ul className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md mt-1 max-h-40 overflow-y-auto w-full">
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

      {error && <p className="mt-1 text-sm text-red-600 absolute">{error}</p>}
    </div>
  );
};

function propsAreEqual(prev, next) {
  const prevPT = prev.params?.productType;
  const nextPT = next.params?.productType;
  const prevCat = prev.params?.category;
  const nextCat = next.params?.category;

  return (
    prev.type === next.type &&
    prev.label === next.label &&
    prev.name === next.name &&
    prev.placeholder === next.placeholder &&
    prev.value === next.value &&
    prev.required === next.required &&
    prev.readOnly === next.readOnly &&
    prev.parent_className === next.parent_className &&
    prev.className === next.className &&
    prev.allowCustomValue === next.allowCustomValue &&
    prev.apiget === next.apiget &&
    prev.apipost === next.apipost &&
    prev.buttonName === next.buttonName &&
    prev.apiparams === next.apiparams &&
    prevPT === nextPT &&
    prevCat === nextCat
  );
}

export default memo(SelectTypeInput, propsAreEqual);