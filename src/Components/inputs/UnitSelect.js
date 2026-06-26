// src/components/layout/UnitSelect.jsx
'use client';
import { useEffect, useState } from "react";
import SelectInput from "./SelectInput";
import { Density_uom_options, Dimension_uom_options, Packing_uom_options, Temp_uom_options, Volume_uom_options, Weight_uom_options } from "@/config/Uom";

const unitrange = {
  Dimension: Dimension_uom_options,
  Volume: Volume_uom_options,
  Weight: Weight_uom_options,
  Temperature: Temp_uom_options,
  Density: Density_uom_options,
  Packing: Packing_uom_options
};

const UnitSelect = ({ type, required, value, onChange, className, name,label, placeholder = 'Select Unit' }) => {
  const [unittype, setUnittype] = useState([]);
  useEffect(() => {
    if (type && unitrange[type]) {
      setUnittype(unitrange[type]);
    } else {
      setUnittype(unitrange.Dimension);
    }
  }, [type]);
  return (
    <>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-primary-text mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <SelectInput className="w-[unset]"
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        options={unittype}
      />
    </>
  );
};

export default UnitSelect;