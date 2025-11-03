
// src/app/items/components/CoreProductFields.js
import React from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import TextArea from '@/Components/inputs/TextArea';
import { coreProductFields } from '@/config/productConfig';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

const CoreProductFields = ({ formData, onChange, errors }) => {
  // console.log('coreProductFields', formData, formData.category_label);
  return (
    // <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 col-span-3">
      <>
        {coreProductFields.map(field => {
          if (field.conditional && !field.conditional(formData)) return null;
          const error = errors?.[field.name];
          const value = formData[field.name];
          const className = field.colSpan ? `md:col-span-${field.colSpan}` : undefined;

          if (field.type === 'select') {
            return (
              <div key={field.name} className={className}>
                <SelectInput
                  name={field.name}
                  value={value ?? ''}
                  onChange={onChange}
                  required={field.required}
                  label={field.label}
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
                  name={field.name}
                  value={value ?? ''}
                  onChange={onChange}
                  required={field.required}
                  label={field.label}
                  placeholder={field.placeholder}
                  options={field.options}
                  apiget={field?.apiget}
                  apipost={field?.apipost}
                />
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.name} className={className}>
                <TextArea
                  name={field.name}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={value ?? ''}
                  onChange={onChange}
                  className={'h-[38px]'}
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
                label={field.label}
                placeholder={field.placeholder}
                value={value ?? ''}
                onChange={onChange}
                required={field.required}
                readOnly={field.readOnly}
              />
            </div>
          );
        })}
      </>
    // </div>
  );
};

export default CoreProductFields;
