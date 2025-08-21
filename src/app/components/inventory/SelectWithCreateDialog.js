'use client';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import SelectTypeInput from '../SelectTypeInput';
import { useToast } from '@/components/toast';
import { axiosInstance } from '../../../lib/axiosInstance';

function SelectWithCreateDialog({
  name,
  placeholder,
  buttonName = 'Add New',
  value,
  onChange,
  // dialog + create config
  initialDraft,
  renderDialog,   // (draft, onDraftChange) => JSX
  buildPayload,   // (draft) => object for POST body
  createUrl,      // string endpoint, should return { option: {label, value} }
  parseLabel,     // optional: (label) => partial draft
  // options can be controlled from parent or kept local (do not default to new array here)
  apiget,
  apiparams,
  params,
  fallbackInputSelector, // optional, defaults to input[name={name}]
  className = 'w-full',
}) {
  const toast = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draft, setDraft] = useState(initialDraft || {});
  const dialogRef = useRef(null);
  const prevFocusRef = useRef(null);

  const openDialog = useCallback((payload) => {
    prevFocusRef.current = document.activeElement; // remember focus

    // Prefill from typed label if parser provided
    if (parseLabel && payload?.label && typeof payload.label === 'string') {
      const parsed = parseLabel(payload.label);
      setDraft(prev => ({ ...(initialDraft || {}), ...(parsed || {}) }));
    } else {
      setDraft({ ...(initialDraft || {}) });
    }

    setIsDialogOpen(true);
    setTimeout(() => {
      const first = dialogRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (first) first.focus();
    }, 0);
  }, [parseLabel, initialDraft]);

  useEffect(() => {
    if (!isDialogOpen) return;

    const root = dialogRef.current;
    if (!root) return;

    const getFocusable = () => Array.from(
      root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onFocusIn = (e) => {
      if (!root.contains(e.target)) {
        // bring focus back into the dialog
        const focusables = getFocusable();
        (focusables[0] || root).focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
    };
  }, [isDialogOpen]);

  const closeDialogAndRestoreFocus = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(() => {
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
        try { prevFocusRef.current.focus(); return; } catch { }
      }
      const selector = fallbackInputSelector || `input[name="${name}"]`;
      const fallback = document.querySelector(selector);
      if (fallback) fallback.focus();
    }, 0);
  }, [fallbackInputSelector, name]);

  const onDraftChange = useCallback((e) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  }, []);

  const saveItem = useCallback(async () => {
    try {
      const payload = buildPayload ? buildPayload(draft) : draft;
      const res = await axiosInstance.post(createUrl, payload);
      if (process.env.NODE_ENV !== 'production') {
        console.log('res', res);
      }
      toast({
        type: "success",
        message: res.data.message || 'Item created successfully',
        duration: 4000,
        autoClose: true,
        placement: "top-right",
        animation: "right-left",
      });
      // Close dialog and restore focus after a successful save
      closeDialogAndRestoreFocus();
    } catch (err) {
      console.error('Failed to create item', err);
      alert(err?.response?.data?.message || 'Failed to create');
      toast({
        type: "error",
        message: res.data.message || 'Failed to create item',
        duration: 4000,
        autoClose: true,
        placement: "top-right",
        animation: "right-left",
      });
    }
  }, [buildPayload, draft, createUrl, toast, closeDialogAndRestoreFocus]);

  return (
    <div className={"w-full flex items-start justify-start flex-1/3 gap-2 flex-col py-2 px-4 border border-gray-300 rounded-md"}>
      <p className="capitalize">{placeholder || name}</p>
      <div className='flex gap-4 w-full'>
        <SelectTypeInput
          className={className}
          type="text"
          name={name}
          placeholder={placeholder}
          apiget={apiget}
          apiparams={apiparams}
          value={value}
          onChange={onChange}
          required
          allowCustomValue={false}
          callBack={openDialog}
          buttonName={buttonName}    
          params={params}      
        />
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeDialogAndRestoreFocus}></div>
          {/* Dialog */}
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="relative z-10 w-full max-w-lg rounded-md bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 id="dialog-title" className="text-base font-semibold">{buttonName}</h3>
              <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm" onClick={closeDialogAndRestoreFocus}>Close</button>
            </div>

            <div className="flex items-start gap-2 flex-col w-full">
              {renderDialog ? renderDialog(draft, onDraftChange) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm" onClick={closeDialogAndRestoreFocus}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm" onClick={saveItem}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom comparator to reduce unnecessary re-renders
function areEqual(prev, next) {
  // re-render if core props change
  if (prev.name !== next.name) return false;
  if (prev.placeholder !== next.placeholder) return false;
  if (prev.buttonName !== next.buttonName) return false;
  if (prev.value !== next.value) return false;
  if (prev.apiget !== next.apiget) return false;

  // re-render if filtering inputs change
  const prevPT = prev.params?.productType;
  const nextPT = next.params?.productType;
  if (prevPT !== nextPT) return false;

  const prevCat = prev.params?.category;
  const nextCat = next.params?.category;
  if (prevCat !== nextCat) return false;

  // re-render if url suffix changes (e.g., 'by-id')
  if (prev.apiparams !== next.apiparams) return false;

  // ignore onChange/buildPayload/renderDialog identities intentionally
  return true;
}

export default memo(SelectWithCreateDialog, areEqual);