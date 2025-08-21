import { cn } from '@/utils/cn';
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
    <div className={cn(`mb-4 flex flex-col ${className}`)}>
      {label && (
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
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
                className="form-radio border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
