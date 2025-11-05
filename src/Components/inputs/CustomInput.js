'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const CustomInput = ({
  label,
  name,
  type = 'text',
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
  onBtnClick,
  btnContent,
  info,
  autoFocus=false,
  min,
  max,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalErr, setInternalErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // setError(err);
  useEffect(() => {
    if (touched && required && !value) {
      setInternalErr(`${label || placeholder || name} is required`);
    }
    else {
      setInternalErr('');
    }
  }, [value, touched, required, label, name, placeholder]);

  const displayErr = (typeof err === 'string' && err.length) ? err : internalErr;
  const errorId = displayErr ? `${id || name}-error` : undefined;

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  const effectiveType = (type === 'password' && showPassword) ? 'text' : type;

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
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white-300">
            {icon}
          </div>
        )}
        <input
          type={effectiveType}
          name={name}
          id={id ? id : name}
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          readOnly={readOnly}
          autoComplete={autocomplete}
          aria-invalid={!!displayErr}
          aria-describedby={errorId}
          className={cn(` block w-full px-3 py-2 border sm:text-sm
          ${ displayErr ? 'border-error' : 'border-white-100' } 
          rounded-lg shadow-sm placeholder-white-400 focus:outline-none focus:ring-2 
          ${ (displayErr && readOnly)
              ? 'focus:ring-error focus:border-error'
              : 'focus:ring-blue-500 focus:border-blue-500' } 
          ${readOnly ? 'bg-black-200 pointer-events-none' : ''} 
               ${icon ? 'pl-10' : ''}
          ${ type === 'password' ? 'pr-10' : '' }
          ${className} text-most-text 
          `)}
          tabIndex={readOnly ? -1 : undefined}
          onFocus={readOnly ? (e) => e.target.blur() : undefined}
          autoFocus={autoFocus}
          {...(type === 'number' ? { min, max, inputMode: 'decimal' } : {})}
        />
        
  {type === 'password' && !readOnly && (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white-600 focus:outline-none"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {showPassword ? (
        // eye closed (slash) icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className='fill-white-600' d="M19.3853 4.21094C19.6713 3.92974 20.1345 3.92958 20.4204 4.21094C20.7064 4.49246 20.7064 4.94893 20.4204 5.23047L4.61475 20.7891C4.47181 20.9296 4.28495 21 4.09814 21C3.91034 21 3.72351 20.9295 3.58057 20.7891C3.29457 20.5075 3.29457 20.0511 3.58057 19.7705L8.77588 14.6553C8.33688 14.0253 8.09814 13.2816 8.09814 12.501C8.09815 10.3826 9.8485 8.66016 12.0005 8.66016C12.7873 8.66023 13.5531 8.89811 14.1899 9.3252L16.2241 7.32422C13.3561 5.48734 9.85944 5.64517 7.12744 7.77441C5.68446 8.8917 4.44473 10.5214 3.53174 12.502C3.93774 13.3869 4.41004 14.2032 4.93604 14.9316C5.16996 15.2555 5.09311 15.7052 4.76416 15.9355C4.63522 16.0261 4.48726 16.0693 4.34033 16.0693C4.11135 16.0693 3.88568 15.9654 3.74268 15.7666C3.10068 14.8777 2.53408 13.8739 2.05908 12.7842C1.98024 12.6032 1.98022 12.3968 2.06006 12.2158C3.08106 9.88871 4.51919 7.96068 6.22119 6.64258C9.51905 4.07452 13.851 3.94749 17.2769 6.28711L19.3853 4.21094ZM19.0229 8.82129C19.3449 8.58208 19.8034 8.64591 20.0474 8.96387C20.7713 9.90984 21.407 11.0051 21.9399 12.2148C22.0198 12.3968 22.0198 12.6042 21.9399 12.7852C19.843 17.5681 16.1273 20.4236 12.0005 20.4238C11.0625 20.4238 10.13 20.2748 9.23096 19.9795C8.84796 19.8525 8.64104 19.4444 8.76904 19.0674C8.89618 18.6896 9.30899 18.4893 9.69385 18.6123C10.4438 18.8584 11.2205 18.9834 12.0005 18.9834C15.4453 18.9832 18.5924 16.5663 20.4683 12.501C20.0093 11.5078 19.4754 10.6107 18.8784 9.83008C18.6354 9.51214 18.699 9.06149 19.0229 8.82129ZM15.2397 12.3457C15.6377 12.4156 15.9025 12.7899 15.8306 13.1826C15.5466 14.7458 14.2877 15.986 12.6997 16.2705C12.6558 16.2774 12.6118 16.2812 12.5679 16.2812C12.222 16.2812 11.9133 16.0387 11.8491 15.6914C11.7771 15.2996 12.041 14.9244 12.439 14.8525C13.4289 14.6763 14.2131 13.9022 14.3911 12.9277C14.4622 12.538 14.8448 12.2748 15.2397 12.3457ZM12.0005 10.0996C10.6555 10.0996 9.56104 11.176 9.56104 12.501C9.56104 12.8918 9.66717 13.2639 9.84717 13.6016L13.1187 10.3809C12.7768 10.2048 12.3953 10.0997 12.0005 10.0996Z"/>
        </svg>
      ) : (
        // eye open icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="fill-amber-500" xmlns="http://www.w3.org/2000/svg" className=''>
          <path className='fill-white-600' d="M12.0024 4C16.1383 4.00211 19.853 6.88654 21.9399 11.7139C22.0199 11.8967 22.0199 12.1033 21.9399 12.2871C21.6919 12.8606 21.4157 13.4186 21.1177 13.9414C20.9186 14.293 20.4745 14.4155 20.1206 14.2188C19.7688 14.0199 19.6453 13.5773 19.8433 13.2275C20.0653 12.8369 20.2753 12.4244 20.4683 12C18.6013 7.89626 15.4533 5.45622 12.0005 5.45508C8.54658 5.45607 5.39872 7.89624 3.53174 12C5.39872 16.1038 8.54658 18.5449 12.0005 18.5449C14.0083 18.5448 15.9452 17.7139 17.6021 16.1406C17.895 15.8654 18.3572 15.875 18.6362 16.165C18.9162 16.4543 18.9038 16.9151 18.6118 17.1924C16.679 19.0279 14.3942 19.9989 12.0024 20H11.9976C7.86261 19.998 4.14706 17.1145 2.05908 12.2871C1.98019 12.1043 1.98019 11.8966 2.05908 11.7139C4.14706 6.88644 7.86261 4.00199 11.9976 4H12.0024ZM11.9995 8.12402C14.1495 8.12402 15.8989 9.86309 15.8989 12C15.8987 14.1377 14.1494 15.876 11.9995 15.876C11.2916 15.8759 10.5986 15.685 9.99561 15.3242C9.64867 15.1185 9.53662 14.671 9.74561 14.3262C9.95362 13.9833 10.4036 13.8694 10.7485 14.0791C11.1245 14.3037 11.5576 14.4218 11.9995 14.4219C13.3424 14.4219 14.4358 13.3356 14.436 12C14.436 10.6662 13.3425 9.5791 11.9995 9.5791C10.6566 9.57919 9.56396 10.6662 9.56396 12C9.56375 12.4024 9.2354 12.7275 8.83154 12.7275C8.42776 12.7274 8.10129 12.4023 8.10107 12C8.10107 9.86314 9.84961 8.12411 11.9995 8.12402Z" />
        </svg>
      )}
    </button>
  )}

        {(onBtnClick || btnContent) && (
          <button
            type="button"
            onClick={onBtnClick}
            className="btn-secondary"
          >
            {btnContent}
          </button>
        )}
      </div>
        {/* {console.log(readOnly)} */}
      {displayErr && <p id={errorId} className="mt-1 text-sm text-error absolute">{displayErr}</p>}
      {readOnly && info && <p id={errorId} className="mt-1 text-sm text-white-500 absolute">{info}</p>}
    </div>
  );
};

export default CustomInput;