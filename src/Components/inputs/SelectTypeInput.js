'use client';
import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  useMemo,
} from 'react';
import { cn } from '../../utils/cn';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '../Loading';
import { downArrow } from '@/utils/SVG';
import { useHighlight } from '@/hooks/useHighlight';

// -------------- helpers --------------
const normalizeOption = (item) => {
  if (item == null) return null;
  if (typeof item === 'string') return { label: item, value: item };
  if (typeof item === 'object') {
    if ('label' in item && 'value' in item) return { label: String(item.label), value: String(item.value) };
    if ('value' in item) return { label: String(item.value), value: String(item.value) };
    if ('name' in item && 'id' in item) return { label: String(item.name), value: String(item.id) };
    // fallback: first string field
    const first = Object.values(item).find(
      (v) => typeof v === 'string' && v.trim()
    );
    return { label: String(first ?? ''), value: String(first ?? '') };
  }
  return { label: String(item), value: String(item) };
};

const normalizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeOption).filter(Boolean);
};

const toTitleCase = (s) => {
  if (typeof s !== 'string') return '';
  return s.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
};

function htmlToPlain(label, saveinfo) {
  const originalLabel = label
  if (!label) return ''
  if (typeof label === 'object') return label;
  if (typeof label === 'string' && /<[^>]+>/.test(label)) {
    if (typeof window !== 'undefined' && typeof window.DOMParser === 'function') {
      const parser = document.createElement('div');
      parser.innerHTML = label;
      const firstEl = parser.firstElementChild;
      if (firstEl) {
        // console.log("/<[^>]+>/", String(firstEl.textContent || '').trim())
        label = String(firstEl.textContent || '').trim();
        if (label.length > 0 && typeof originalLabel === 'string' && /<[^>]+>/.test(originalLabel) && saveinfo) {
          // console.log("originalLabel", originalLabel.replace(firstEl.outerHTML,''))
          const labelstring = htmlToPlainForSearch(originalLabel.replace(firstEl.outerHTML, ''))
          if (saveinfo) saveinfo(labelstring)
        }
      }
    }
  }

  return String(label);
}

function htmlToPlainForSearch(label) {
  if (!label) return '';
  if (typeof label === 'object') return label;
  if (typeof label === 'string' && /<[^>]+>/.test(label)) {
    // Create a temporary DOM element (browser-safe)
    const temp = document.createElement('div');
    // temp.innerHTML = label;
    // console.log("label", label, label.split(/<[^>]+>/).filter((item) => item))
    let finallabel = String(label.trim().split(/<[^>]+>/).filter((item) => item).join(' - ')).trim();
    return finallabel;
  }
  return String(label);
}
// -------------- component --------------
const SelectTypeInput = ({
  id,
  type = 'text',
  label,
  name,
  placeholder = '',
  options: optionsProp,
  value, // ← SINGLE SOURCE OF TRUTH (parent)
  onChange,
  required = false,
  readOnly = false,
  parent_className = '',
  className = '',
  allowCustomValue = false,
  apiget,
  apiparams,
  params,
  apipost,
  onBlur,
  callBack,
  buttonName,
  inputRef = null,
  dropdownHeight = 'max-h-40',
  err,
  onFocus,
  autoFocus = false,
  inputLoading,
  icon,
}) => {
  // local UI only
  const [inputValue, setInputValue] = useState('');   // what user sees
  const [options, setOptions] = useState(() => normalizeArray(optionsProp || []));
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [loading, setLoading] = useState(inputLoading || false);
  const [fetching, setFetching] = useState(false);
  const [created, setCreated] = useState(false);
  const [info, setInfo] = useState('');
  const [touched, setTouched] = useState(false);
  const [internalErr, setInternalErr] = useState('');
  const rootRef = useRef(null);
  const componentinput = useRef(null);
  inputRef = inputRef || componentinput;
  const dropdownRef = useRef(null);
  const clearBtnRef = useRef(null);
  const listItemRefs = useRef([]);
  const listRef = useHighlight(inputValue.toLowerCase(), 'inputHighlight');

  // Helper: find by option.value OR by plain-text option.label
  const findOptionByValueOrLabel = useCallback((opts, v) => {
    if (!v) return { found: null, matched: null };
    const sv = String(v);
    let found = opts.find((o) => String(o.value) === sv);
    if (found) return { found, matched: 'value' };
    found = opts.find((o) => htmlToPlain(o.label).toLowerCase() === sv.toLowerCase());
    if (found) return { found, matched: 'label' };
    return { found: null, matched: null };
  }, []);

  // Avoid infinite onChange loops by remembering last emitted pair
  const lastSyncRef = useRef({ value: null, label: null });

  // stable emitter so callbacks can depend on it safely
  const emitChange = useCallback((val, labelText) => {
    onChange?.({
      target: { name, value: val },
      label: { name, value: labelText },
    });
  }, [onChange, name]);

  const displayErr = err || internalErr;
  const errorId = displayErr ? `${id || name}-error` : undefined;

  // ------------ 1) fetch options once (and when api deps change) ------------
  const fetchOptions = useCallback(
    async (searchValue = '', ignore = false) => {
      if (!apiget) {
        setOptions(normalizeArray(optionsProp || []));
        return;
      }
      setFetching(true);
      try {
        const queryParams = {};
        if (params?.productType) queryParams.productType = params.productType;
        if (params?.category) queryParams.category = params.category;
        if (searchValue) queryParams.search = searchValue;

        const base = (apiget || '').replace(/\/+$/, '');
        const suffix = (apiparams || '').replace(/^\/+/, '');
        const url = suffix ? `${base}/${suffix}` : base;

        const res = await axiosInstance.get(
          url,
          Object.keys(queryParams).length ? { params: queryParams } : undefined
        );

        if (!ignore && Array.isArray(res.data)) {
          setOptions(normalizeArray(res.data));
        }
      } catch (e) {
        if (!ignore) {
          setOptions([]);
          setInternalErr(
            e?.response?.data?.message || e.message || 'Failed to fetch'
          );
        }
      } finally {
        if (!ignore) setFetching(false);
      }
    },
    [apiget, apiparams, optionsProp, params?.productType, params?.category]
  );

  useEffect(() => {
    let ignore = false;
    fetchOptions('', ignore);
    return () => {
      ignore = true;
    };
  }, [fetchOptions]);

  // ------------ 2) parent -> inputValue sync (ONLY here) ------------
  useEffect(() => {
    const raw = value == null ? '' : String(value);
    if (!raw) {
      // empty value: clear input and reset guard
      setInputValue((prev) => (prev !== '' ? '' : prev));
      lastSyncRef.current = { value: '', label: '' };
      return;
    }

    // Try to find by value first, then by label (plain text)
    const { found } = findOptionByValueOrLabel(options, raw);
    // console.log("found", found)
    // Normalize to canonical (value,label)
    const normalizedValue = found ? String(found.value) : raw;
    const nextLabel = found ? htmlToPlain(found.label) : raw;

    // Keep what user sees in sync with normalized label
    setInputValue((prev) => (prev === nextLabel ? prev : nextLabel));

    // Emit onChange only if the normalized pair changed since last sync
    const last = lastSyncRef.current;
    if (last.value !== normalizedValue || last.label !== nextLabel) {
      lastSyncRef.current = { value: normalizedValue, label: nextLabel };
      emitChange?.(normalizedValue, nextLabel);
      // onChange?.({ target: { name, value: normalizedValue }, label: { name, value: nextLabel } });
    }
  }, [value, options, findOptionByValueOrLabel, onChange, name, emitChange]);

  // ------------ 3) validation ------------
  useEffect(() => {
    if (touched && required && !inputValue) {
      setInternalErr(`${label || placeholder || name} is required`);
    } else {
      setInternalErr('');
    }
  }, [touched, required, inputValue, label, placeholder, name]);

  // ------------ 4) derived filtered options ------------
  const filteredOptions = useMemo(() => {
    if (fetching) return [];
    if (!inputValue) return options;
    const needle = inputValue.toLowerCase();
    return options.filter((opt) =>
      needle.split(' ').every((w) => opt.label.toLowerCase().includes(w)) ||
      htmlToPlainForSearch(opt.label).toLowerCase().includes(needle)
    );
  }, [options, inputValue, fetching]);

  // ------------ helpers ------------

  const handleSelect = useCallback(
    (option) => {
      const labelText = htmlToPlain(option.label, setInfo);
      setInputValue(labelText);
      setShowOptions(false);
      setHighlightedIndex(null);
      setCreated(false);
      emitChange(option.value, labelText);
    },
    [emitChange]
  );

  const handleFocus = useCallback(() => {
    onFocus?.();
    if (readOnly) return;
    // Always open the dropdown on focus so the inline "Create" option can be shown
    setShowOptions(true);
    setHighlightedIndex(0);
  }, [onFocus, readOnly]);

  const handleBlur = useCallback(
    (e) => {
      setTouched(true);
      const next = e?.relatedTarget;
      // if blur goes to dropdown, ignore
      // console.log('rootRef.current', rootRef.current, 'next', next, 'rootRef.current.contains(next)', rootRef.current.contains(next), 'clearBtnRef.current', clearBtnRef.current);
      if (rootRef.current && next && rootRef.current.contains(next) && !clearBtnRef.current) return;
      setShowOptions(false); // this is not working as expected after typeing or selecting focuse moves to next element which is this --> (<button type="button" aria-label="Clear selection" class="absolute right-3 top-1/2 -translate-y-1/2 text-md text-white-300 scale-90 hover:text-white-700 w-[20px] h-[20px] flex justify-center items-center">✕</button>)  it's right but option should be hidden

      if (!allowCustomValue) {
        const v = value == null ? '' : String(value);
        // console.log('v', v);
        if (!v) {
          // console.log('clearing input', clearBtnRef);
          clearBtnRef.current = false // i want to make here non focus element
          setInputValue('');
        } else {
          const found = options.find((o) => String(o.value) === v);
          if (found) setInputValue(htmlToPlain(found.label));
          else setInputValue(v);
        }
      }

      onBlur?.(e);
    },
    [allowCustomValue, value, options, onBlur] // inputValue, selectedValue, err 
  );

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setInputValue(val);
      setShowOptions(true);
      setHighlightedIndex(0);

      if (allowCustomValue) {
        emitChange(val, val);
      } else {
        // only emit if exact match
        const match = options.find(
          (opt) => htmlToPlain(opt.label) === val
        );
        if (match) {
          emitChange(match.value, htmlToPlain(match.label));
        }
      }
    },
    [allowCustomValue, options, emitChange]
  );

  // clear from parent / button

  const clearSelection = useCallback(() => {
    setInputValue('');
    setShowOptions(false);
    setHighlightedIndex(null);
    setCreated(false);
    setInfo('');
    emitChange('', '');
    if (required) inputRef.current.focus();
  }, [emitChange, required, inputRef]);


  // create & save
  const shouldShowCreateButton =
    (apipost || typeof callBack === 'function') &&
    inputValue.trim() &&
    !options.some(
      (o) => htmlToPlain(o.label).toLowerCase().includes(inputValue.trim().toLowerCase())
    );

  const handleCreateAndSave = useCallback(async () => {
    const val = inputValue.trim();
    if (!val) return;

    // custom callback
    if (typeof callBack === 'function') {
      try {
        await callBack({ name, label: val, value: val });
        // console.log('created');
        setCreated(true);
      } catch (e) {
        setInternalErr(e?.message || 'Callback failed');
      }
      return;
    }

    if (!apipost) return;
    setLoading(true);
    try {
      await axiosInstance.post(apipost, { [name]: val });
      await fetchOptions('');
      emitChange(val, val);
      setCreated(true);
    } catch (e) {
      setInternalErr(e?.response?.data?.message || e.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  }, [inputValue, name, callBack, apipost, fetchOptions, emitChange]);

  const handleKeyDown = useCallback((e) => {
    const extra = shouldShowCreateButton ? 1 : 0;
    const listCount = filteredOptions.length + extra;
    if (!showOptions || listCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev === null || prev === listCount - 1) return 0;
        return prev + 1;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev === null || prev === 0) return listCount - 1;
        return prev - 1;
      });
    } else if (e.key === 'Enter') {
      if (highlightedIndex !== null) {
        e.preventDefault();
        if (shouldShowCreateButton && highlightedIndex === 0) {
          handleCreateAndSave();
        } else {
          const baseIndex = shouldShowCreateButton ? highlightedIndex - 1 : highlightedIndex;
          const opt = filteredOptions[baseIndex];
          if (opt) handleSelect(opt);
        }
      }
    } else if (e.key === 'Escape') {
      setShowOptions(false);
    } else if (e.key === 'Tab') {
      if (showOptions) {
        if (highlightedIndex !== null) {
          if (shouldShowCreateButton && highlightedIndex === 0) {
            handleCreateAndSave();
          } else {
            const baseIndex = shouldShowCreateButton ? highlightedIndex - 1 : highlightedIndex;
            const opt = filteredOptions[baseIndex];
            if (opt) handleSelect(opt);
          }
        }
        setShowOptions(false);
      }
      // allow natural focus move afterwards
    }
  }, [filteredOptions, highlightedIndex, showOptions, handleSelect, handleCreateAndSave, shouldShowCreateButton]);



  // scroll into view
  useEffect(() => {
    if (showOptions && dropdownRef.current) {
      const container = document.getElementById('main_display');
      if (!container) return;
      const timer = setTimeout(() => {
        const rect = dropdownRef.current.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        if (rect.bottom > cRect.bottom) {
          container.scrollBy({
            top: rect.bottom - cRect.bottom + 10,
            behavior: 'smooth',
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showOptions]);

  // when highlighted item changes via keyboard, ensure it's visible in the list
  useEffect(() => {
    if (!showOptions) return;
    if (highlightedIndex == null) return;
    const el = listItemRefs.current[highlightedIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex, showOptions]);

  // Reset refs array length to avoid leftovers when the filtered list shrinks
  useEffect(() => {
    listItemRefs.current = [];
  }, [filteredOptions, shouldShowCreateButton]);

  return (
    <div ref={rootRef} className={cn(`mb-5 w-full relative ${parent_className}`)}>
      {loading || fetching ? <Loading variant='skeleton' className='h-9' /> : 
      <>
        {label ? (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-primary-text mb-1"
          >
            {label} {required && <span className="text-error ml-1">*</span>}
          </label>
        ) : null}

        <div className="relative flex items-center gap-2">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white-300">
              {icon}
            </div>
          )}
          <input
            id={id || name}
            name={name}
            type={type}
            required={required}
            value={inputValue}
            placeholder={loading ? 'Saving...' : placeholder}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            ref={inputRef}
            autoComplete="off"
            disabled={loading}
            aria-invalid={!!displayErr}
            aria-describedby={errorId}
            className={cn(
              `block flex-2 px-3 py-2 border sm:text-sm rounded-lg shadow-xs placeholder-white-400 focus:outline-none focus:border-0.5 focus:ring-3
                ${icon ? 'pl-10' : ''}`,
              displayErr
                ? 'border-error focus:ring-error/30 focus:border-error'
                : 'border-white-200 focus:ring-blue-500/30 focus:border-blue-500',
              readOnly ? 'bg-black-200 pointer-events-none' : '',
              loading ? 'bg-gray-100 text-gray-400' : '',
              className
            )}
            autoFocus={autoFocus}
            tabIndex={readOnly ? -1 : 0}
          />

          {!loading && (
            inputValue && !shouldShowCreateButton && !readOnly ? (
              <button
                type="button"
                aria-label="Clear selection"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-md text-white-300 scale-90 hover:text-white-700 w-[20px] h-[20px] flex justify-center items-center"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearSelection}
                ref={clearBtnRef}
                tabIndex={0}
              >
                ✕
              </button>
            ) : (
              !shouldShowCreateButton &&
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-white-300 scale-75 pointer-events-none flex justify-center items-center">
                {downArrow()}
              </span>
            )
          )}
        </div>

        {showOptions && (filteredOptions.length > 0 || shouldShowCreateButton) && (
          <div className="absolute z-30 rounded-lg w-full" ref={dropdownRef}>
            <div
              className={cn(
                'mb-5 mt-1 bg-black-200 border border-white-200 overflow-hidden shadow-lg rounded-lg backdrop-blur-2xl',
                dropdownHeight
              )}
            >
              <ul className={cn('overflow-y-auto w-full p-1.5', dropdownHeight)} ref={listRef}>
                {shouldShowCreateButton && (
                  <li
                    ref={(el) => { listItemRefs.current[0] = el; }}
                    className={cn(
                      'px-3 py-3 cursor-pointer text-sm rounded-lg font-medium',
                      highlightedIndex === 0 ? 'bg-white-100' : ''
                    )}
                    onMouseDown={(e) => { e.preventDefault(); handleCreateAndSave(); }}>
                    + Create &quot;{inputValue.trim()}&quot; {label || ''}
                  </li>
                )}
                {filteredOptions.map((opt, idx) => (
                  <li
                    key={idx}
                    ref={(el) => {
                      const offset = shouldShowCreateButton ? 1 : 0;
                      listItemRefs.current[idx + offset] = el;
                    }}
                    className={cn(
                      'px-3 py-2 cursor-pointer text-sm rounded-lg',
                      (shouldShowCreateButton ? idx + 1 : idx) === highlightedIndex ? 'bg-white-100' : ''
                    )}
                    onMouseDown={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(shouldShowCreateButton ? idx + 1 : idx)}
                    dangerouslySetInnerHTML={{ __html: opt.label }}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {displayErr && (
          <p id={errorId} className="mt-1 text-sm text-error absolute">
            {displayErr}
          </p>
        )}
        {!displayErr && info && (
          <p className="mt-1 text-xs text-primary-text absolute px-2 lowercase">
            {info}
          </p>
        )}
      </>}
    </div>
  );
};

// keep memo but make it simpler — re-render if value or endpoints change
function propsAreEqual(prev, next) {
  if (prev.value !== next.value) return false;
  if (prev.apiget !== next.apiget) return false;
  if (prev.apiparams !== next.apiparams) return false;
  if ((prev.params?.productType ?? '') !== (next.params?.productType ?? '')) return false;
  if ((prev.params?.category ?? '') !== (next.params?.category ?? '')) return false;
  return (
    prev.name === next.name &&
    prev.label === next.label &&
    prev.placeholder === next.placeholder &&
    prev.required === next.required &&
    prev.readOnly === next.readOnly &&
    prev.className === next.className &&
    prev.parent_className === next.parent_className
  );
}

export default memo(SelectTypeInput, propsAreEqual);