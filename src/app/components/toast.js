"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cn } from "../utils/cn";

const ToastContext = createContext();

const TOAST_STYLES = {
  success: "bg-green-100 border border-green-300 text-green-800",
  error: "bg-red-100 border border-red-300 text-red-800",
  warning: "bg-yellow-100 border border-yellow-300 text-yellow-800",
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
      type = "info",
      message,
      duration = 3000,
      autoClose = true,
      placement = "top-right",
      animation = "top-bottom",
    }) => {
      const id = toastId++;
      setToasts((current) => [
        ...current,
        { id, type, message, duration, autoClose, placement, animation },
      ]);
      if (autoClose && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container full screen fixed to hold all toasts */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {toasts.map(({ id, type, message, autoClose, placement, animation }) => (
          <ToastWrapper key={id} placement={placement}>
            <Toast
              type={type}
              message={message}
              autoClose={autoClose}
              animation={animation}
              onClose={() => removeToast(id)}
            />
          </ToastWrapper>
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
  return context;
}

function ToastWrapper({ placement, children }) {
  // This wrapper positions individual toast based on placement with pointer-events-auto to allow clicks inside
  const placementClass = PLACEMENT_STYLES[placement] || PLACEMENT_STYLES["top-right"];

  return (
    <div
      className={cn(
        "absolute pointer-events-auto max-w-xs",
        placementClass
      )}
      style={{ margin: "0.5rem" }}
    >
      {children}
    </div>
  );
}

function Toast({ type = "info", message, onClose, autoClose, animation = "top-bottom" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

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
      className={cn(
        toastClass,
        baseAnimation,
        showAnimation,
        "px-4 py-3 rounded shadow flex justify-between items-center text-sm font-medium font-sans"
      )}
    >
      <div className="flex-1 pr-3">{message}</div>
      {!autoClose && (
        <button
          onClick={handleClose}
          aria-label="Close toast"
          className="bg-transparent border-none font-bold text-lg cursor-pointer leading-none p-0 m-0"
        >
          ×
        </button>
      )}
    </div>
  );
}