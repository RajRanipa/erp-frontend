'use client';
import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';

const SIZES = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

const FOCUSABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([readonly]):not([disabled])',
  'select:not([readonly]):not([disabled])',
  'textarea:not([readonly]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])'
];
const FOCUSABLE_QUERY = FOCUSABLE_SELECTORS.join(',');

function isVisible(el) {
  try { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); } catch { return false; }
}

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
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
  const panelRef = useRef(null);
  const childrenRef = useRef(null);
  const savedActiveElementRef = useRef(null);
  const dialogIdRef = useRef(Symbol('dialog-id'));
  const openCounter = useRef(0);

  // Dialog stack management
  useEffect(() => {
    if (!window.__dialogStack) window.__dialogStack = [];
    const id = dialogIdRef.current;

    if (open && !window.__dialogStack.includes(id)) {
      window.__dialogStack.push(id);
      openCounter.current += 1;
    } else if (!open) {
      const idx = window.__dialogStack.indexOf(id);
      if (idx !== -1) window.__dialogStack.splice(idx, 1);
    }
  }, [open]);

  // Save currently focused element on open
  useEffect(() => {
    if (open) savedActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);

  // Autofocus first focusable element inside dialog
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
        const container = childrenRef.current;
        const focusable = container
          ? Array.from(container.querySelectorAll(FOCUSABLE_QUERY)).filter(isVisible)
          : [];
        // console.log("focusable", focusable)
        if (focusable.length > 0) {
          focusable[0].focus({ preventScroll: true });
        } else if (panelRef.current) {
          panelRef.current.focus({ preventScroll: true });
        }
        firstFocusDoneRef.current = true;
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [open, shown]);

  // Restore focus on close (topmost only)
  useEffect(() => {
    if (open || !mounted) return;
    // console.log('open || !mounted', open, mounted, open || !mounted)
    const stack = window.__dialogStack || [];
    // console.log('stack', stack, stack[stack.length - 1] !== dialogIdRef.current)
    // if (stack.length && stack[stack.length - 1] !== dialogIdRef.current) return;

    let target = null;
    try {
      if (typeof getBackFocus === 'function') target = getBackFocus();
      else if (getBackFocus?.current instanceof HTMLElement) target = getBackFocus.current;
      else if (getBackFocus instanceof HTMLElement) target = getBackFocus;
    } catch { target = null; }
    // console.log('target', target)
    if (!target) target = savedActiveElementRef.current;
    if (target && document.contains(target)) {
      try { target.focus({ preventScroll: true }); } catch { }
    }
    savedActiveElementRef.current = null;
  }, [open, getBackFocus, mounted]);

  // Mount/unmount + animation
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ESC to close (topmost)
  useEffect(() => {
    if (!closeOnEsc || !mounted) return;
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;
      const stack = window.__dialogStack || [];
      if (stack[stack.length - 1] !== dialogIdRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [mounted, closeOnEsc, onClose]);

  // Focus trap inside dialog
  useEffect(() => {
    if (!mounted || !open) return;
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const stack = window.__dialogStack || [];
      if (stack[stack.length - 1] !== dialogIdRef.current) return;
      if (!panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_QUERY)).filter(isVisible);
      if (focusable.length === 0) return e.preventDefault();

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last || !panelRef.current.contains(active)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', trap, true);
    return () => document.removeEventListener('keydown', trap, true);
  }, [mounted, open]);

  if (!mounted) return null;

  const sizeClass = SIZES[size] || SIZES.md;
  const isCenter = side === 'center';

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 flex ${isCenter ? 'items-center justify-center' : 'justify-end'} w-screen h-screen transition-opacity duration-300 ${open ? 'bg-black/50 backdrop-blur-[2px] opacity-100' : 'bg-black/0 opacity-0 pointer-events-none'} ${overlayClassName}`}
        onMouseDown={(e) => { if (!closeOnOverlay) return; if (e.target === e.currentTarget) onClose?.(); }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className={`bg-zinc-800 text-secondary-text flex flex-col w-full ${sizeClass} ${className} ${isCenter ? 'rounded-lg' : 'h-full'}
            transform transition-all duration-300 ease-out will-change-transform
            ${shown ? 'translate-x-0 scale-100 opacity-100' : side === 'right' ? 'translate-x-full' : side === 'left' ? '-translate-x-full' : 'scale-95 opacity-0'}`}
        >
          {(title || onClose) && (
            <div className="flex items-center justify-between gap-2 p-3 border-b border-color-100">
              {typeof title === 'string' ? <h3 className="text-lg font-semibold capitalize">{title}</h3> : title}
              {onClose && <button type="button" className="btn btn-ghost flex items-center justify-center" onClick={onClose} aria-label="Close dialog">✕</button>}
            </div>
          )}
          {/* <div ref={childrenRef} className="p-4 space-y-3 overflow-auto h-[-webkit-fill-available]">{children}</div> */}
          <div ref={childrenRef} className="p-4 space-y-3 overflow-auto">{children}</div>
          {actions && <div className="flex justify-end gap-2 p-3 border-t border-color-100">{actions}</div>}
        </div>
      </div>
    </Portal>
  );
});

export default Dialog;