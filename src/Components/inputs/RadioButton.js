import { cn } from '../../utils/cn';
import React, { useState } from 'react';

export default function RadioButton({
  label,
  name,
  options,
  value,
  onChange,
  required,
  className = '',
  id,
}) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  const handleBlur = () => {
    setTouched(true);
    if (required && !value) {
      setError('This field is required');
    } else {
      setError('');
    }
  };

  const handleChange = (e) => {
    onChange(e);
    if (touched) {
      if (required && !e.target.value) {
        setError('This field is required');
      } else {
        setError('');
      }
    }
  };

  return (
    <div className={cn(`mb-5 flex flex-col ${className}`)}>
      {label && (
        <legend className="font-medium text-primary-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </legend>
      )}
      <div className="flex flex-row gap-4 items-center">
        {options.map((option, index) => {
          const optionId = id ? `${id}-${index}` : `${name}-${index}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className="inline-flex items-center cursor-pointer"
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                onBlur={handleBlur}
                required={required}
                className="form-radio border-white-200 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-primary-text">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
