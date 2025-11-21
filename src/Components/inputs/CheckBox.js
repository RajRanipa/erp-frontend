// src/app/Components/inputs/CheckBox.jsx
// src/Components/inputs/CheckBox.js
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * CheckBox
 * - Consistent visuals + behavior with CustomInput (required, error, readOnly)
 * - Supports controlled usage via `checked`
 * - Optional indeterminate state
 *
 * Props:
 *  - label?: string
 *  - name: string
 *  - checked?: boolean
 *  - onChange?: (e) => void
 *  - onBlur?: (e) => void
 *  - required?: boolean
 *  - readOnly?: boolean
 *  - disabled?: boolean
 *  - parent_className?: string
 *  - className?: string
 *  - id?: string
 *  - err?: string
 *  - info?: string
 *  - indeterminate?: boolean
 *  - autoFocus?: boolean
 */
const CheckBox = ({
    label,
    name,
    checked = false,
    onChange,
    onBlur,
    required = false,
    readOnly = false,
    disabled = false,
    parent_className = '',
    className = '',
    id = '',
    err,
    info,
    indeterminate = false,
    autoFocus = false,
    value = '',
    checkText = '',
}) => {
    const [touched, setTouched] = useState(false);
    const [internalErr, setInternalErr] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        // keep the visual indeterminate state in sync
        if (inputRef.current) {
            inputRef.current.indeterminate = Boolean(indeterminate);
        }
    }, [indeterminate]);

    useEffect(() => {
        if (touched && required && !checked) {
            setInternalErr(`${label || name} is required`);
        } else {
            setInternalErr('');
        }
    }, [checked, touched, required, label, name]);

    const displayErr = useMemo(() => {
        return typeof err === 'string' && err.length ? err : internalErr;
    }, [err, internalErr]);

    const errorId = displayErr ? `${id || name}-error` : undefined;

    const handleBlur = (e) => {
        setTouched(true);
        onBlur?.(e);
    };

    const handleChange = (e) => {
        if (readOnly || disabled) return;
        onChange?.(e);
    };

    return (
        <div className={cn(`mb-5 w-full relative ${parent_className}`)}>
            {label && (
                <label htmlFor={id || name} className="block text-sm font-medium text-primary-text mb-1">
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <div
                className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2',
                    displayErr ? 'border-error' : 'border-white-100',
                    readOnly ? 'bg-black-200 pointer-events-none' : '',
                )}
            >
                <input
                    ref={inputRef}
                    type="checkbox"
                    id={id || name}
                    name={name}
                    checked={!!checked}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!displayErr}
                    aria-describedby={errorId}
                    disabled={disabled}
                    className={cn(
                        `block w-4 h-4 rounded-lg border-white-200 text-blue-600 focus:outline-none
             focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500`,
                        className
                    )}
                    tabIndex={readOnly ? -1 : undefined}
                    onFocus={readOnly ? (e) => e.target.blur() : undefined}
                    autoFocus={autoFocus}
                />
                <span className="text-[1em] text-most-text select-none">{value || label || checkText}</span>

                {/* <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-white-100 rounded-full peer peer-checked:bg-blue-500 relative
       transition-all duration-300 before:content-[''] before:absolute before:left-1 before:top-1 
       before:bg-white before:h-4 before:w-4 before:rounded-full before:transition-all 
       peer-checked:before:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-most-text">Enable feature</span>
                </label> */}
            </div>

            {displayErr && (
                <p id={errorId} className="mt-1 text-sm text-error absolute">
                    {displayErr}
                </p>
            )}
            {readOnly && info && (
                <p className="mt-1 text-sm text-white-500 absolute">{info}</p>
            )}
            {!readOnly && info && (
                <p className="mt-1 text-xs text-white-500 flex-1">{info}</p>
            )}
        </div>
    );
};

export default CheckBox;