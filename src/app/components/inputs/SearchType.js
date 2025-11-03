'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { cn } from '../../utils/cn';
import { axiosInstance } from '@/lib/axiosInstance'

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
  onBlur,
  callBack,
  buttonName,
  onSelectOption,
  userSelectedValue = undefined,
  err,
  inputRef = null,
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

  // Merge internal and external error
  const displayErr = (typeof err === 'string' && err.length) ? err : error;
  // console.log("displayErr",displayErr)
  const errorId = displayErr ? `${id || name}-error` : undefined;


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

  // --- userSelectedValue handling ---
  // This block handles external preselection or clear directives from parent.
  // When userSelectedValue changes, we attempt to match it against options,
  // update inputValue and selectedValue, call onChange, and trigger onSelectOption callback.
  useEffect(() => {
    // If prop is truly not provided, do nothing.
    if (typeof value === 'undefined') return;
    
    userSelectedValue = value;
    console.log("userS electe dVal ue",userSelectedValue)
    // NEW: explicit clear directive from parent (row-scoped), always fire
    if (userSelectedValue && typeof userSelectedValue === 'object' && userSelectedValue.action === 'clear') {
      if (inputValue !== '') setInputValue('');
      if (selectedValue !== '') setSelectedValue('');
      onChange?.({ target: { name, value: '' } });
      onSelectOption?.(null);
      return;
    }

    // If null or empty string -> reject/clear value explicitly.
    if (userSelectedValue === null || userSelectedValue === '') {
      if (inputValue !== '') setInputValue('');
      if (selectedValue !== '') setSelectedValue('');
      onChange?.({ target: { name, value: '' } });
      onSelectOption?.(null);
      return;
    }

    // Only attempt matching when we have options in memory.
    if (!Array.isArray(options) || options.length === 0) return;

    // Normalize directive into {label, value}
    let uv = null;
    if (typeof userSelectedValue === 'string') {
      uv = { label: userSelectedValue, value: userSelectedValue };
    } else if (userSelectedValue && typeof userSelectedValue === 'object') {
      uv = normalizeOption(userSelectedValue);
    }
    if (!uv) return;

    const match = options.find(o => String(o.value) === String(uv.value) || String(o.label) === String(uv.label));

    if (match) {
      // Avoid redundant state updates
      const needLabel = inputValue !== match.label;
      const needValue = String(selectedValue) !== String(match.value);
      if (needLabel) setInputValue(match.label);
      if (needValue) setSelectedValue(match.value);
      if (needValue) onChange?.({ target: { name, value: match.value } });
      // If we find a matching option, call onSelectOption to notify parent of the selected option.
      onSelectOption?.(match);
    } else {
      // Provided value doesn't exist in options -> clear
      if (inputValue !== '') setInputValue('');
      if (selectedValue !== '') setSelectedValue('');
      onChange?.({ target: { name, value: '' } });
      onSelectOption?.(null);
    }
  }, [value, options, inputValue, selectedValue, name, onChange, onSelectOption]);


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

        // console.log('SelectTypeInput.fetchOptions', { url, queryParams });
        if (inputValue !== '') {
          setInputValue('');
        }
        if (selectedValue !== '') {
          setSelectedValue('');
        }
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

      // Reject when: no exact match.
      if (!exact) {
        setIfChanged(setInputValue, inputValue, '');
        setIfChanged(setSelectedValue, selectedValue, '');
        if (onChange) onChange({ target: { name, value: '' } });
        // Notify parent via onSelectOption about the final selection on blur.
        // If no match, send null to indicate rejection.
        onSelectOption?.(null);
        return;
      }

      // Accept exact match
      setIfChanged(setSelectedValue, selectedValue, exact.value);
      if (onChange) onChange({ target: { name, value: exact.value } });
      // Notify parent via onSelectOption about the final selection on blur.
      // If no match, send null to indicate rejection.
      onSelectOption?.(exact);
    }
    // onBlur,
    if (typeof onBlur === 'function') onBlur(e);
  }, [allowCustomValue, inputValue, name, onChange, options, selectedValue, onSelectOption, err]);

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

  // New handler for input keydown to handle Tab key and fallback to navigation
  const handleInputKeyDown = React.useCallback((e) => {
    if (e.key === 'Tab') {
      if (showOptions) {
        setShowOptions(false); // hide options list
      }
      return; // allow focus to move to next element
    }
    handleKeyDown(e); // call existing navigation handler
  }, [handleKeyDown, showOptions]);

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
    // console.log('SelectTypeInput.handleCreateAndSave clicked', { name, inputValue, selectedValue, hasCreator: Boolean(apipost) || typeof callBack === 'function' });

    if (typeof callBack === 'function') {
      // console.log('SelectTypeInput: invoking callBack', { name, label: inputValue, value: selectedValue || inputValue });
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
          // here if api make get new request for input option then i want to clear selected value or input value understand this file and make it happen
          if (inputValue !== '') {
            console.log("inputValue 1", inputValue)
            setInputValue('');
          }
          if (selectedValue !== '') {
            console.log("selectedValue 1", selectedValue)
            setSelectedValue('');
          }
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

  // Dropdown ref for scrolling into view
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    if (showOptions && dropdownRef.current) {
      const container = document.getElementById('main_display');
      if (!container) return;

      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const dropdownHeight = dropdownRect.height;
      const containerHeight = containerRect.height;
      const offset = 10;

      // If dropdown is taller than the container, do nothing
      if (dropdownHeight >= containerHeight) return;

      // Run after 100ms delay
      const timer = setTimeout(() => {
        const updatedRect = dropdownRef.current.getBoundingClientRect();
        const updatedContainerRect = container.getBoundingClientRect();

        if (updatedRect.bottom > updatedContainerRect.bottom) {
          container.scrollBy({
            top: updatedRect.bottom - updatedContainerRect.bottom + offset,
            behavior: 'smooth'
          });
        } else if (updatedRect.top < updatedContainerRect.top) {
          container.scrollBy({
            top: updatedRect.top - updatedContainerRect.top - offset,
            behavior: 'smooth'
          });
        }
      }, 50);

      return () => clearTimeout(timer); // cleanup
    }
  }, [showOptions]);

  return (

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
            id={id ? id : name}
            type={type}
            name={name}
            value={loading ? (inputValue || '') : inputValue}
            placeholder={loading ? 'Saving...' : placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={(e) => {
              // Prevent focus when the input is read-only
              if (readOnly) {
                // move focus away immediately
                try { e.target.blur(); } catch { /* ignore */ }
                return;
              }
              handleFocus();
            }}
            onKeyDown={handleInputKeyDown}
            readOnly={readOnly}
            ref={inputRef}
            autoComplete="off"
            disabled={loading}
            tabIndex={readOnly ? -1 : undefined}
            aria-invalid={!!displayErr}
            aria-describedby={errorId}
            className={cn(`block w-full px-3 py-2 border sm:text-sm
              ${displayErr ? 'border-error' : 'border-white-100'}
              rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2
              ${displayErr ? 'focus:ring-error focus:border-error'
                : 'focus:ring-blue-500 focus:border-blue-500'}
              ${readOnly ? 'bg-black-200 pointer-events-none' : ''}
              ${loading ? 'bg-gray-100 text-gray-400' : ''}
              ${className}
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
            className="btn-secondary"
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
        <div className="absolute z-30 rounded-lg  w-full " ref={dropdownRef}>
          <div

            className='mb-5 mt-1 bg-black-200 border border-white-100 overflow-hidden shadow-md rounded-lg max-h-40 backdrop-blur-2xl'
          >
            <ul className="max-h-40 overflow-y-auto w-full ">
              {filteredOptions.map((option, idx) => (
                <li
                  key={idx}
                  className={cn(
                    "px-3 py-2 cursor-pointer text-sm",
                    idx === highlightedIndex ? "bg-white-200" : ""
                  )}
                  onMouseDown={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(idx)} // Sync hover with keyboard navigation
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
          </div>
        </div>
      )}

      {displayErr && (
        <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>
      )}
    </div>
  );
};

function propsAreEqual(prev, next) {
  const getUSVKey = (u) => {
    if (u == null) return '';
    if (typeof u === 'object') {
      if (u.action === 'clear') return `clear:${String(u.token ?? '')}`;
      const v = u.value ?? u.id ?? '';
      const l = u.label ?? u.name ?? '';
      return `${String(v)}|${String(l)}`;
    }
    return String(u);
  };
  const prevUSV = getUSVKey(prev.userSelectedValue);
  const nextUSV = getUSVKey(next.userSelectedValue);

  if (prev.value ?? '' !== next.value ?? '') return false;
  if (prevUSV !== nextUSV) return false;

  // ... your existing comparisons (type, label, name, placeholder, params, etc.)
  return (
    prev.type === next.type &&
    prev.label === next.label &&
    prev.name === next.name &&
    prev.placeholder === next.placeholder &&
    prev.required === next.required &&
    prev.readOnly === next.readOnly &&
    prev.parent_className === next.parent_className &&
    prev.className === next.className &&
    prev.allowCustomValue === next.allowCustomValue &&
    prev.apiget === next.apiget &&
    prev.apipost === next.apipost &&
    prev.buttonName === next.buttonName &&
    prev.apiparams === next.apiparams &&
    (prev.params?.productType ?? '') === (next.params?.productType ?? '') &&
    (prev.params?.category ?? '') === (next.params?.category ?? '') &&
    prev.err === next.err
  );
}

export default memo(SelectTypeInput, propsAreEqual);
