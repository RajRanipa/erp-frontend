// src/app/components/Dialog.jsx
'use client';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
// import { useCallback } from 'react';

/**
 * Reusable Dialog component
 *
 * Props:
 * - open: boolean — controls visibility
 * - title?: string | ReactNode — header title (optional)
 * - children: ReactNode — dialog body content
 * - actions?: ReactNode — footer actions (e.g., buttons). If not provided, renders a default Close button.
 * - closeDialog?: () => void — called when overlay/ESC/Close is triggered
 * - side?: 'right' | 'left' | 'center' — slide direction / placement (default 'right')
 * - size?: 'sm' | 'md' | 'lg' | 'xl' — panel max width (default 'md')
 * - className?: string — extra classes for the panel
 * - overlayClassName?: string — extra classes for overlay
 * - closeOnOverlay?: boolean — close when clicking overlay (default true)
 * - closeOnEsc?: boolean — close when pressing Escape (default true)
 */
const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

function getOffscreenClass(side) {
  switch (side) {
    case 'left':
      return '-translate-x-full';
    case 'center':
      return 'scale-95 opacity-0';
    case 'right':
    default:
      return 'translate-x-full';
  }
}

function getOnscreenClass(side) {
  switch (side) {
    case 'left':
    case 'right':
      return 'translate-x-0';
    case 'center':
      return 'scale-100 opacity-100';
    default:
      return 'translate-x-0';
  }
}

// focus helpers (module-level to avoid re-allocations)
const FOCUSABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([readonly]):not([disabled])',
  'select:not([readonly]):not([disabled])',
  'textarea:not([readonly]):not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
];
const FOCUSABLE_QUERY = FOCUSABLE_SELECTORS.join(',');
function isVisible(el) {
  try {
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  } catch (e) {
    return false;
  }
}

// Portal wrapper component
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [portalElement, setPortalElement] = useState(null);
  useEffect(() => {
    setMounted(true);
    setPortalElement(document.body);
  }, []);
  if (!mounted || !portalElement) return null;
  return createPortal(children, portalElement);
};

const Dialog = memo(function Dialog({
  open,
  title,
  children,
  actions,
  onClose,
  side = 'right',
  size = 'md',
  className = '',
  overlayClassName = '',
  closeOnOverlay = true,
  closeOnEsc = true,
  getBackFocus = null
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const timerRef = useRef(null);
  const panelRef = useRef(null);
  const prevOpenRef = useRef(false);
  // Ref for children container to autofocus first focusable element
  const childrenContainerRef = useRef(null);
  const savedActiveElementRef = useRef(null);

  const dialogIdRef = useRef(Symbol('dialog-id'));

  useEffect(() => {
    window.__dialogStack = window.__dialogStack || [];
    window.__dialogStack.push(dialogIdRef.current);
    return () => {
      const idx = window.__dialogStack.indexOf(dialogIdRef.current);
      if (idx !== -1) window.__dialogStack.splice(idx, 1);
    };
  }, []);

  // Autofocus + save/restore focus + focus trap
  // Save focused element on open, focus first visible focusable element after mount

  const closeDialog = useCallback(() => {
    // resolve the callback to call after restoring focus
    const cb = typeof onClose === 'function' ? onClose : null;
    // cleanup saved ref
    savedActiveElementRef.current = null;

    // finally call the close callback (if provided)
    if (cb) cb();
  }, [onClose, getBackFocus]);

  useEffect(() => {
    // console.log("save focus")
    if (open) {
      try {
        savedActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      } catch (e) {
        savedActiveElementRef.current = null;
      }
    }
  }, [open]);

  // Restore focus on open -> closed transition, only if this dialog is topmost
  useEffect(() => {
    console.log("restore focus")
    const wasOpen = prevOpenRef.current;
    // update prev open for next render
    prevOpenRef.current = !!open;
    console.log('open', open, wasOpen);
    // if transitioned from open -> closed
    if (!open && wasOpen) {
      const stack = window.__dialogStack || [];
      const isTop = stack[stack.length - 1] === dialogIdRef.current;
      if (!isTop) return; // only topmost dialog should restore focus

      let target = null;
      try {
        if (typeof getBackFocus === 'function') {
          target = getBackFocus();
        } else if (getBackFocus?.current instanceof HTMLElement) {
          target = getBackFocus.current;
        } else if (getBackFocus instanceof HTMLElement) {
          target = getBackFocus;
        }
      } catch (e) {
        target = null;
      }

      if (!target) target = savedActiveElementRef.current;
      if (target && document.contains(target) && typeof target.focus === 'function') {
        try {
          target.focus({ preventScroll: true });
        } catch (e) { /* ignore */ }
      }

      savedActiveElementRef.current = null;
    }
  }, [open, getBackFocus]);

  const firstFocusDoneRef = useRef(false);

  useEffect(() => {
    // console.log("focusable")
    if (!open) {
      firstFocusDoneRef.current = false;
      return;
    }
    // open === true
    if (firstFocusDoneRef.current) return;

    // Wait for the portal & children to paint
    const raf = requestAnimationFrame(() => {
      // Optional second raf to be extra-safe with animations
      requestAnimationFrame(() => {
        const container = childrenContainerRef.current;
        const focusable = container
          ? Array.from(container.querySelectorAll(FOCUSABLE_QUERY)).filter(isVisible)
          : [];
        console.log("focusable", focusable)
        if (focusable.length > 0) {
          focusable[0].focus({ preventScroll: true });
        } else if (panelRef.current) {
          panelRef.current.focus({ preventScroll: true });
        }
        firstFocusDoneRef.current = true;
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [open, shown]); // use shown or some flag that indicates panel is painted


  // Handle mount + open animation (double rAF ensures initial paint)
  useEffect(() => {
    // console.log("animation")
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true));
      });
    } else {
      setShown(false);
      timerRef.current = setTimeout(() => setMounted(false), 300); // keep in sync with duration-300
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    // console.log("esc")
    if (!closeOnEsc || !mounted) return;

    function onKey(e) {
      if (e.key !== 'Escape') return;

      // Only topmost dialog handles Escape
      const stack = window.__dialogStack || [];
      const top = stack[stack.length - 1];
      if (top !== dialogIdRef.current) return;

      e.stopPropagation();
      e.preventDefault();
      closeDialog?.();
    }

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mounted, closeOnEsc, closeDialog]);

  // Focus trap: keep focus inside the dialog
  useEffect(() => {
    console.log("focus trap", mounted, open)
    if (!mounted || !open) return;

    const handleFocusTrap = (e) => {
      if (e.key !== 'Tab') return;
      console.log("handleFocusTrap")
      const stack = window.__dialogStack || [];
      const top = stack[stack.length - 1];
      console.log("stack", stack, top, dialogIdRef.current)
      if (top !== dialogIdRef.current) return;
      if (!panelRef.current) return;

      const focusableElements = panelRef.current.querySelectorAll(FOCUSABLE_QUERY);
      const visibleFocusableElements = Array.from(focusableElements).filter(isVisible);
      if (visibleFocusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = visibleFocusableElements[0];
      const lastElement = visibleFocusableElements[visibleFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === firstElement || !panelRef.current.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement || !panelRef.current.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap, true);

    return () => {
      document.removeEventListener('keydown', handleFocusTrap, true);
    };
  }, [mounted, open]);

  if (!mounted) return null;

  const sizeClass = SIZES[size] || SIZES.md;
  const isCenter = side === 'center';

  // Render dialog content in portal
  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 flex ${isCenter ? 'items-center justify-center' : 'justify-end'} w-screen h-screen transition-opacity duration-300 ${open ? 'bg-black/50 opacity-100 backdrop-blur-[2px]' : 'bg-black/0 opacity-0 pointer-events-none'} ${overlayClassName}`}
        onMouseDown={(e) => {
          if (!closeOnOverlay) return;
          if (e.target === e.currentTarget) closeDialog?.();
        }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className={`bg-zinc-800  text-secondary-text flex flex-col text-text w-full ${sizeClass} ${className} ${isCenter ? 'rounded-lg' : ''} ${isCenter ? '' : 'h-full'}
            ${isCenter ? 'transform transition-all duration-300 ease-out will-change-transform' : 'transform transition-transform duration-300 ease-out will-change-transform'}
            ${shown ? getOnscreenClass(side) : getOffscreenClass(side)}
          `}
        >
          {(title || closeDialog) && (
            <div className="flex items-center justify-between gap-2 p-3 border-b border-color-100">
              {typeof title === 'string' ? (
                <h3 className="text-lg font-semibold capitalize">{title}</h3>
              ) : (
                title
              )}
              {closeDialog && (
                <button type="button" className="btn btn-ghost" onClick={closeDialog} aria-label="Close dialog">✕</button>
              )}
            </div>
          )}
          {/*
            Autofocus logic: childrenContainerRef is attached to the container div below.
          */}
          <div ref={childrenContainerRef} className="p-4 space-y-3 overflow-auto h-fit" id='child_container'>
            {children}
          </div>
          {actions && <div className="flex justify-end gap-2 p-3 border-t border-color-100">
            {actions ? (
              actions
            ) : (
              <>
                {closeDialog && (
                  <button type="button" className="btn" onClick={closeDialog}>Close</button>
                )}
              </>
            )}
          </div>}
        </div>
      </div>
    </Portal>
  );
});

export default Dialog;