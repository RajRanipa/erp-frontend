
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
      "capitalize block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none sm:text-sm " +
      "transition-colors duration-150 " +
      "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
    const errorInputClass =
      "border-red-500 focus:border-red-500 focus:ring-red-500";
    const finalInputClass =
      baseInputClass + (error ? " " + errorInputClass : "") + (className ? " " + className : "");

    return (
      <div className={cn(`mb-5 w-auto`)}>
        {label && (
          <label
            htmlFor={id || name}
            className="block mb-1 font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
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
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
SelectInput.displayName = "SelectInput";

export default SelectInput;