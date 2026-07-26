
// src/app/items/components/CoreProductFields.js
import React from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import TextArea from '@/Components/inputs/TextArea';
import { coreProductFields } from '@/config/productConfig';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

const CoreProductFields = ({ formData, onChange, errors, identityLocked = false }) => {
  return (
    // <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 col-span-3">
      <>
        {coreProductFields.map(field => {
          if (field.conditional && !field.conditional(formData)) return null;
          const error = errors?.[field.name];
          const value = formData[field.name];
          const className = field.colSpan ? `md:col-span-${field.colSpan}` : undefined;
          const readOnly = identityLocked && !['minimumStock', 'description'].includes(field.name);

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
                  err={error || ''}
                  disabled={readOnly}
                />
              </div>
            );
          }

          if (field.type === 'selecttype') {
            const categoryLabel = String(formData.category_label || '').toLowerCase();
            const options = field.options || (
              categoryLabel.includes('raw')
                ? field.raw
                : categoryLabel.includes('packing')
                  ? field.packing
                  : field.finished
            );
            return (
              <div key={field.name} className={className}>
                <SelectTypeInput
                  name={field.name}
                  value={value ?? ''}
                  onChange={onChange}
                  required={field.required}
                  label={field.label}
                  placeholder={field.placeholder}
                  options={options}
                  apiget={field?.apiget}
                  apipost={field?.apipost}
                  allowCustomValue={field?.allowCustomValue ?? false}
                  apiparams={field?.apiparams ? field.apiparams(formData) : null}
                  err={error || ''}
                  readOnly={readOnly}
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
                err={error || ''}
                readOnly={readOnly}
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
                readOnly={readOnly || field.readOnly}
                err={error || ''}
              />
            </div>
          );
        })}
      </>
    // </div>
  );
};

export default CoreProductFields;
