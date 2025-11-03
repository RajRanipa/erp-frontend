
"use client";
import { cn } from "@/utils/cn";
import React, { useState, forwardRef } from "react";

// SelectInput: Styled select input matching CustomInput styles
const SelectInput = forwardRef(
  (
    {
      label,
      name,
      options = [],
      value,
      onChange,
      required = false,
      className = "",
      id,
      placeholder,
      ...rest
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);
    const [error, setError] = useState("");

    const handleBlur = (e) => {
      setTouched(true);
      if (required && (!e.target.value || e.target.value === "")) {
        setError("This field is required.");
      } else {
        setError("");
      }
      if (rest.onBlur) rest.onBlur(e);
    };

    const handleChange = (e) => {
      if (error) setError("");
      if (onChange) onChange(e);
    };

    // Styles (should match CustomInput)
    const baseInputClass =
      "capitalize block w-full rounded-lg border px-3 py-2 text-most-text shadow-sm focus:outline-none sm:text-sm " +
      "transition-colors duration-150 " +
      "border-white-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
    const errorInputClass =
      "border-error focus:border-error focus:ring-error";
    const finalInputClass =
      baseInputClass + (error ? " " + errorInputClass : "") + (className ? " " + className : "");

    return (
      <div className={cn(`mb-5 w-auto`)}>
        {label && (
          <label
            htmlFor={id || name}
            className="block mb-1 font-medium text-primary-text"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <select
          id={id || name}
          name={name}
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className={cn(finalInputClass)}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-400"> {/* this was hidden before */}
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
SelectInput.displayName = "SelectInput";

export default SelectInput;