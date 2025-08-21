import React from 'react';
import CustomInput from '@/components/CustomInput';
import SelectInput from '@/components/SelectInput';
import TextArea from '@/components/TextArea';
import { coreProductFields } from '@/config/productConfig';
import SelectTypeInput from '../SelectTypeInput';

const CoreProductFields = ({ formData, onChange, errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 col-span-3">
      {coreProductFields.map(field => {
        if (field.conditional && !field.conditional(formData)) return null;
        const error = errors?.[field.name];
        const value = formData[field.name];
        const className = field.colSpan ? `md:col-span-${field.colSpan}` : undefined;

        if (field.type === 'select') {
          return (
            <div key={field.name} className={className}>
              <SelectInput
                key={field.name}
                name={field.name}
                value={value ?? ''}
                onChange={onChange}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
              />
            </div>
          );
        }

        if (field.type === 'selecttype') {
          return (
            <div key={field.name} className={className}>
              <SelectTypeInput
                key={field.name}
                name={field.name}
                value={value ?? ''}
                onChange={onChange}
                required={field.required}
                placeholder={field.placeholder}
                apiget={field.apiget}
                apipost={field.apipost}
              />
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name} className={className}>
              <TextArea
                key={field.name}
                name={field.name}
                placeholder={field.placeholder}
                value={value ?? ''}
                onChange={onChange}
              />
            </div>
          );
        }

        return (
          <div key={field.name} className={className}>
            <CustomInput
              key={field.name}
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={value ?? ''}
              onChange={onChange}
              required={field.required}
              readOnly={field.readOnly}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CoreProductFields;
