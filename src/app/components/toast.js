"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cn } from "../utils/cn";

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: "bg-green-100 border border-green-300 text-green-800",
  error: "bg-red-100 border border-red-300 text-red-800",
  warning: "bg-yellow-50 border border-yellow-500 text-yellow-800",
  info: "bg-blue-100 border border-blue-300 text-blue-800",
};

const PLACEMENT_STYLES = {
  "top-left": "top-5 left-5",
  "top-center": "top-5 left-1/2 transform -translate-x-1/2",
  "top-right": "top-5 right-5",
  "bottom-left": "bottom-5 left-5",
  "bottom-center": "bottom-5 left-1/2 transform -translate-x-1/2",
  "bottom-right": "bottom-5 right-5",
  center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
};

// Animations control: fade + slide directions, keyed by animation prop
const ANIMATION_CLASSES = {
  "top-bottom": {
    enter: "opacity-100 translate-y-0",
    leave: "opacity-0 -translate-y-4",
  },
  "bottom-top": {
    enter: "opacity-100 translate-y-0",
    leave: "opacity-0 translate-y-4",
  },
  "left-right": {
    enter: "opacity-100 translate-x-0",
    leave: "opacity-0 -translate-x-4",
  },
  "right-left": {
    enter: "opacity-100 translate-x-0",
    leave: "opacity-0 translate-x-4",
  },
  fade: {
    enter: "opacity-100",
    leave: "opacity-0",
  },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      id: providedId,
      type = "info",
      message,
      duration = 3000,
      autoClose = true,
      placement = "top-right",
      animation = "top-bottom",
      modal = false,
    }) => {
      const id =
        providedId !== undefined && providedId !== null
          ? providedId
          : toastId++;
      setToasts((current) => [
        ...current,
        { id, type, message, duration, autoClose, placement, animation, modal },
      ]);
      if (autoClose && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container full screen fixed to hold all toasts */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {toasts.map(({ id, type, message, autoClose, placement, animation, modal }) => (
          modal ? (
            <div key={id} className="fixed inset-0 z-[10000] pointer-events-auto">
              <div className="absolute inset-0 bg-black/40" />
              <ToastWrapper placement={placement} modal>
                <Toast
                  type={type}
                  message={message}
                  autoClose={autoClose}
                  animation={animation}
                  onClose={() => removeToast(id)}
                  modal
                />
              </ToastWrapper>
            </div>
          ) : (
            <ToastWrapper key={id} placement={placement}>
              <Toast
                type={type}
                message={message}
                autoClose={autoClose}
                animation={animation}
                onClose={() => removeToast(id)}
              />
            </ToastWrapper>
          )
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.addToast;
}

// Full API (add & remove)
export function useToastApi() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastApi must be used within a ToastProvider");
  }
  return context; // { addToast, removeToast }
}

// Promise-based confirm toast
export function useConfirmToast() {
  const { addToast, removeToast } = useToastApi();
  return (message, {
    placement = "top-center",
    animation = "top-bottom",
    confirmText = "Yes",
    cancelText = "Cancel",
    type = "warning",
    restoreFocus = true,
    focusTarget = null, // HTMLElement | React.RefObject | CSS selector string
  } = {}) => {
    const id = toastId++;
    const restore = () => {
      if (!restoreFocus) return;
      let target = null;
      if (focusTarget) {
        if (typeof focusTarget === "string") {
          target = document.querySelector(focusTarget);
        } else if (focusTarget && "current" in focusTarget) {
          target = focusTarget.current;
        } else if (focusTarget instanceof HTMLElement) {
          target = focusTarget;
        }
      } else {
        target = typeof window !== "undefined" ? document.activeElement : null;
        target = target instanceof HTMLElement ? target : null;
      }
      // Restore focus on next tick after DOM updates
      if (target && typeof target.focus === "function") {
        setTimeout(() => {
          try { target.focus(); } catch {}
        }, 0);
      }
    };

    return new Promise((resolve) => {
      const confirm = () => { resolve(true); removeToast(id); restore(); };
      const cancel = () => { resolve(false); removeToast(id); restore(); };

      addToast({
        id,
        type,
        autoClose: false,
        placement,
        animation,
        modal: true,
        message: (
          <div className="flex flex-col gap-2 overflow-hidden" tabIndex={-1}>
            <span>{message}</span>
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancel}
                className="px-3 py-1 rounded-lg bg-secondary hover:bg-primary"
                data-role="cancel-btn"
                autoFocus
              >
                {cancelText}
              </button>
              <button
                onClick={confirm}
                className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                data-role="confirm-btn"
              >
                {confirmText}
              </button>
            </div>
          </div>
        ),
      });
    });
  };
}

function ToastWrapper({ placement, children, modal = false }) {
  // This wrapper positions individual toast based on placement with pointer-events-auto to allow clicks inside
  const placementClass = PLACEMENT_STYLES[placement] || PLACEMENT_STYLES["top-right"];

  return (
    <div
      className={cn(
        "absolute pointer-events-auto max-w-md",
        placementClass
      )}
      style={{ margin: "0.5rem" }}
    >
      {children}
    </div>
  );
}

function Toast({ type = "info", message, onClose, autoClose, animation = "top-bottom", modal = false }) {
  const [visible, setVisible] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    setVisible(true);
    if (!modal) return;
    const el = containerRef.current;
    if (!el) return;

    // Prevent background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable (prefer cancel button)
    const focusables = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const cancelBtn = el.querySelector('[data-role="cancel-btn"]');
    const first = cancelBtn || focusables[0];
    if (first && typeof first.focus === 'function') first.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Prefer cancel button action if present
        if (cancelBtn) cancelBtn.click();
        else onClose();
      }
      if (e.key === 'Tab') {
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    el.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      el.removeEventListener('keydown', onKeyDown);
    };
  }, [modal, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const baseAnimation = "transition-opacity transition-transform duration-300 ease-in-out";

  const animClasses = ANIMATION_CLASSES[animation] || ANIMATION_CLASSES["top-bottom"];

  const showAnimation = visible ? animClasses.enter : animClasses.leave;

  const toastClass = TOAST_STYLES[type] || TOAST_STYLES.info;

  return (
    <div
      role="alert"
      ref={containerRef}
      tabIndex={-1}
      className={cn(
        toastClass,
        baseAnimation,
        showAnimation,
        "px-4 py-3 rounded-lg shadow flex justify-between items-center text-sm font-medium font-sans"
      )}
    >
      <div className="flex-1 pr-3 capitalize">{message}</div>
      {!autoClose && (
        <button
          onClick={handleClose}
          aria-label="Close toast"
          className="bg-transparent border-none font-bold text-lg cursor-pointer leading-none p-0 m-0 self-start"
        >
          ×
        </button>
      )}
    </div>
  );
}