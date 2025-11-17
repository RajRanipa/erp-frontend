'use client';
import React from 'react';
import { cn } from '@/utils/cn';

/**
 * SubmitButton — Reusable ERP-wide submit button
 * Props:
 * - label: string (button text)
 * - loading: boolean (shows spinner)
 * - disabled: boolean
 * - className: string (extra styles)
 * - onClick: function
 * - children: optional ReactNode
 */
export default function SubmitButton({
  type = 'submit',
  label = 'Submit',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const isDisabled = false || disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-fit items-center focus:bg-teal-800 justify-center gap-2 rounded-lg px-3.5 py-1.5 font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-teal-800 focus:ring-2 focus:ring-offset-2 ',
        isDisabled
          ? 'bg-white-400 cursor-not-allowed opacity-75'
          : 'bg-teal-600 hover:bg-teal-800 active:bg-primary-darker',
        className
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin " />
          <span className="text-sm opacity-80">Processing...</span>
        </>
      ) : (
        children || label 
      )}
    </button>

);
}
// {/* <span className='cursor-pointer'>{label}</span> */}