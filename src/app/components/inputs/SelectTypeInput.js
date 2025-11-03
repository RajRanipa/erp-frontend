'use client';
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { cn } from '../../utils/cn';
import { axiosInstance } from '@/lib/axiosInstance'

const normalizeOption = (item) => {
  // console.log("it's called and active ", item)
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

const setIfChanged = (setter, current, next, callfrom) => {
  // console.log("current: ", current, "next: ", next, "callfrom: ", callfrom);
  if (current !== next) setter(next);
};

function htmlTostring(label){
  if(!label) return ''
  if (typeof label === 'object') return label;
  if (typeof label === 'string' && /<[^>]+>/.test(label)) {
    if (typeof window !== 'undefined' && typeof window.DOMParser === 'function') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(label, 'text/html');
      const firstEl = doc.body.firstElementChild;
      if (firstEl) {
        console.log("/<[^>]+>/", String(firstEl.textContent || '').trim())
        label = String(firstEl.textContent || '').trim();
      }
    }
  }
  return String(label);
}
// {
//     // Debug
//   console.log("setIfChanged called with:", next);

//   // If `next` is an object with a label prop, prefer that
//   if (next && typeof next === 'object' && 'label' in next) {
//     const nextLabel = next.label;
//     if (current !== nextLabel) setter(nextLabel);
//     // return;
//   }

//   // If `next` looks like HTML (string containing a tag), extract the text
//   let toSet = next;
//   try {
//     if (typeof next === 'string' && /<[^>]+>/.test(next)) {
//       // Use DOMParser in browser to safely extract the first element's textContent
//       if (typeof window !== 'undefined' && typeof window.DOMParser === 'function') {
//         const parser = new window.DOMParser();
//         const doc = parser.parseFromString(next, 'text/html');
//         const firstEl = doc.body.firstElementChild;
//         if (firstEl) {
//           toSet = String(firstEl.textContent || '').trim();
//         } else {
//           // fallback: strip all tags
//           toSet = next.replace(/<[^>]+>/g, '').trim();
//         }
//       } else {
//         // fallback for non-browser env: strip tags
//         toSet = next.replace(/<[^>]+>/g, '').trim();
//       }
//     }
//   } catch (err) {
//     console.warn('setIfChanged: failed to parse HTML, using raw value', err);
//     toSet = next;
//   }

//   if (current !== toSet) setter(toSet);
// }

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
  apiparams,
  apipost,
  params,
  onBlur,
  callBack,
  buttonName,
  err,
  inputRef = null,
}) => {
  const [touched, setTouched] = useState(false);
  // Centralized error state, merged with external err prop.
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(''); // what user sees (label)
  const [selectedValue, setSelectedValue] = useState(value ?? ''); // what we send (value)
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [options, setOptions] = useState(optionsProp || []);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [fetching, setFetching] = useState(false); // for async loading
  const rootRef = useRef(null);

  // Merge internal and external error
  const displayErr = (typeof err === 'string' && err.length) ? err : error;
  const errorId = displayErr ? `${id || name}-error` : undefined;


  // Sync input from selected value only when selectedValue/options change,
  // not on every keystroke (avoids wiping user typing).
  useEffect(() => {
    if (selectedValue && options.length) {
      const found = options.find(o => String(o.value) === String(selectedValue));
      if (found) setIfChanged(setInputValue, inputValue, htmlTostring(found.label), "sync");
    } else if (!selectedValue) {
      if (inputValue !== '') setIfChanged(setInputValue, inputValue, '', "empty sync");
    }
  }, [selectedValue, options, inputValue]);


  // Fetch options from backend (debounced)
  const fetchOptions = useCallback(
    async (searchValue = '', ignore = false) => {
      // console.log("fetchOptions 00100 called")
      if (!apiget) {
        // Fallback to provided optionsProp when no apiget
        if (optionsProp && optionsProp.length) {
          const norm = chekobject(optionsProp || []);
          setOptions(norm);
        }
        return;
      }
      setFetching(true);
      try {
        const queryParams = {};
        if (params?.productType) queryParams.productType = params.productType;
        if (params?.category) queryParams.category = params.category;
        // Optionally, you can pass searchValue as a param for filtering server-side
        if (searchValue) queryParams.search = searchValue;
        const hasFilters = Object.keys(queryParams).length > 0;
        const base = (apiget || '').replace(/\/+$/, '');
        const suffix = (apiparams || '').replace(/^\/+/, '');
        const needsAppend = hasFilters && suffix && !base.endsWith(`/${suffix}`);
        const url = needsAppend ? `${base}/${suffix}` : base;
        if (!ignore) {
          if (inputValue !== '') setInputValue('');
          if (selectedValue !== '') setSelectedValue('');
        }
        const res = await axiosInstance.get(url, hasFilters ? { params: queryParams } : undefined);
        if (!ignore && Array.isArray(res.data)) {
          const norm = chekobject(res.data);
          setOptions(norm);
        }
      } catch (err) {
        if (!ignore) {
          setOptions([]);
        }
        setError(err?.response?.data?.message || err.message || 'Failed to fetch options');
      }
      setFetching(false);
    },
    [apiget, apiparams, optionsProp, params?.productType, params?.category, inputValue, selectedValue]
  );


  // Only fetch options once on initial mount
  useEffect(() => {
    let ignore = false;
    fetchOptions('', ignore);
    return () => { ignore = true; };
  }, []); // empty dependency array ensures single call on mount

  // Validation effect for required fields
  useEffect(() => {
    if (touched && required && !inputValue) {
      setError(`${label || placeholder || name} is required`);
    } else {
      setError('');
    }
  }, [inputValue, touched, required, label, name, placeholder]);

  /**
   * Handles selection of an option from the dropdown.
   * @param {object} option - The selected option.
   */
  const handleSelect = useCallback((option) => {
    setIfChanged(setInputValue, inputValue, htmlTostring(option.label), "handleSelect");
    setIfChanged(setSelectedValue, selectedValue, option.value, "handleSelect");
    if (onChange) {
      onChange({ target: { name, value: option.value }, label: { name, value: htmlTostring(option.label) } });
    }
    setShowOptions(false);
    setHighlightedIndex(null);
  }, [inputValue, name, onChange, selectedValue]);

  /**
   * Handles focus on the input, showing the dropdown and highlighting the first option.
   */
  const handleFocus = useCallback(() => {
    if (options.length > 0) {
      setShowOptions(true);
      setHighlightedIndex(0);
    }
  }, [options]);

  // Derive filteredOptions from options and inputValue unless fetching in progress
  const filteredOptions = React.useMemo(() => {
    if (fetching) return [];
    if (!inputValue) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue, fetching]);

  /**
   * Handles blur event on the input, validating and closing dropdown as needed.
   */
  const handleBlur = useCallback((e) => {
    setTouched(true);
    // If focus is moving to an element inside this component (button/menu), do not reject
    const next = e?.relatedTarget;
    if (rootRef.current && next && rootRef.current.contains(next)) return;
    setShowOptions(false);
    if (!allowCustomValue) {
      const exact = options.find(opt => htmlTostring(opt.label) === inputValue);
      // Reject when: no exact match.
      if (!exact) {
        setIfChanged(setInputValue, inputValue, '', 'handleBlur');
        setIfChanged(setSelectedValue, selectedValue, '', 'handleBlur');
        if (onChange) onChange({ target: { name, value: '' }, label: { name, value: '' } });
        return;
      }
      // Accept exact match
      setIfChanged(setSelectedValue, selectedValue, exact.value, 'handleBlur');
      if (onChange) onChange({ target: { name, value: exact.value }, label: { name, value: htmlTostring(exact.label) } });
    }
    if (typeof onBlur === 'function') onBlur(e);
  }, [allowCustomValue, inputValue, name, onChange, options, selectedValue, err]);

  // Helper for updating state and filtering on input change (splits handleChange)
  const updateInputAndFilter = (val) => {
    setIfChanged(setInputValue, inputValue, htmlTostring(val), "updateInputAndFilter");
    setCreated(false);
    setIfChanged(setSelectedValue, selectedValue, val, "updateInputAndFilter");
    if (onChange) onChange({ target: { name, value: val }, label: { name, value: val } }); // raj
  };

  /**
   * Handles input value change, filtering options and updating state.
   * No longer triggers fetchOptions on input changes.
   */
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    if (!allowCustomValue) {
      setIfChanged(setInputValue, inputValue, htmlTostring(val), "handleChange");
      const exact = options.find(opt => opt.label === val);
      setIfChanged(setSelectedValue, selectedValue, exact ? exact.value : val, "handleChange");
      if (onChange) onChange({ target: { name, value: exact ? exact.value : '' }, label: { name, value: exact ? htmlTostring(exact.label) : '' } });
      setShowOptions(true);
      setHighlightedIndex(
        (val.trim() && filteredOptions.length) ? 0 : null
      );
    } else {
      updateInputAndFilter(val);
      setShowOptions(true);
      setHighlightedIndex(0);
    }
    // eslint-disable-next-line
  }, [allowCustomValue, inputValue, name, onChange, options, selectedValue, filteredOptions.length]);

  /**
   * Handles keyboard navigation and accessibility in the dropdown.
   * Arrow keys, Enter, Escape, and Tab.
   */
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
    } else if (e.key === 'Escape') {
      setShowOptions(false);
    } else if (e.key === 'Tab') {
      if (showOptions) {
        if (highlightedIndex !== null && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        setShowOptions(false);
      }
      // Let Tab move focus naturally
    }
  }, [filteredOptions, highlightedIndex, showOptions, handleSelect]);

  /**
   * Handles input keydown, forwarding navigation and accessibility keys.
   */
  const handleInputKeyDown = React.useCallback((e) => {
    handleKeyDown(e);
  }, [handleKeyDown]);

  // Helper: should show create button (works with apipost or callBack)
  const hasCreator = Boolean(apipost) || typeof callBack === 'function';
  const shouldShowCreateButton =
    hasCreator &&
    inputValue.trim() &&
    !options.some(opt => opt.label.toLowerCase().trim().includes(inputValue.toLowerCase().trim())) && // keep as requested
    !created;

  /**
   * Handles creating and saving a new entry using apipost or callBack.
   * Splits helpers for option creation and post.
   */
  const addOptionLocally = (label, value) => {
    let newOptions = options;
    const newOpt = normalizeOption({ label, value });
    if (!newOptions.some(o => String(o.value) === String(newOpt.value))) {
      newOptions = [...newOptions, newOpt];
      setOptions(newOptions);
    }
    return newOpt;
  };

  /**
   * Main handler for create & save button.
   */
  const handleCreateAndSave = useCallback(async () => {
    if (typeof callBack === 'function') {
      try {
        callBack({ name, label: inputValue, value: selectedValue || inputValue });
      } catch (e) {
        setError(e?.message || 'Callback failed');
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
      if (apiget) {
        try {
          if (inputValue !== '') setInputValue('');
          if (selectedValue !== '') setSelectedValue('');
          const res = await axiosInstance.get(apiget);
          setOptions(chekobject(res.data));
        } catch {
          addOptionLocally(inputValue, selectedValue || inputValue);
        }
      } else {
        addOptionLocally(inputValue, selectedValue || inputValue);
      }
      // Lock selection to the created option
      const createdOpt = options.find(o => o.label === inputValue) || { label: inputValue, value: selectedValue || inputValue };
      setIfChanged(setInputValue, inputValue, htmlTostring(createdOpt.label), "handleCreateAndSave");
      setIfChanged(setSelectedValue, selectedValue, createdOpt.value, "handleCreateAndSave");
      if (onChange) onChange({ target: { name, value: createdOpt.value }, label: { name, value: htmlTostring(createdOpt.label) } });
      setCreated(true);
      setShowOptions(false);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create and save');
    }
    setLoading(false);
  }, [apiget, apipost, callBack, inputValue, name, onChange, options, selectedValue]);

  // Dropdown ref for scrolling into view
  const dropdownRef = React.useRef(null);

  // Sync input from value prop on initial render or when options change
  useEffect(() => {
    if (!options || options.length === 0) return;
    if (value === null || value === undefined || value === '') return;
    console.log('value changed', value);
    // Find option where value matches either option.value or option.label
    const found = options.find(
      o => String(o.value) === String(value) || String(o.label) === String(value)
    );

    if (found) {
      setIfChanged(setInputValue, inputValue, htmlTostring(found.label), "updateInputAndFilter");
      setIfChanged(setSelectedValue, selectedValue, found.value, "updateInputAndFilter");

      // Call onChange so parent knows the correct selected value
      if (onChange) {
        onChange({ target: { name, value: found.value }, label: { name, value: htmlTostring(found.label) } });
      }
    }
  }, [value, options]);

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
              rounded-lg shadow-sm placeholder-white-400  focus:outline-none focus:ring-2
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
                    idx === highlightedIndex ? "bg-white-100" : ""
                  )}
                  onMouseDown={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(idx)} // Sync hover with keyboard navigation
                  ref={el => {
                    if (idx === highlightedIndex && el) {
                      el.scrollIntoView({ block: 'nearest' });
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: option.label }}
                >
                  {/* {option.label} */}
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

  if (prev.value ?? '' !== next.value ?? '') return false;

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
