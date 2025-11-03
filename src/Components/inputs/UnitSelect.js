// src/components/layout/UnitSelect.jsx
'use client';
import { useEffect, useState } from "react";
import SelectInput from "./SelectInput";

const unitrange = {
  Dimension: [
    { value: "mm", label: "Millimeter" },
    { value: "cm", label: "Centimeter" },
    { value: "m", label: "Meter" },
    { value: "km", label: "Kilometer" },
    { value: "in", label: "Inch" },
    { value: "ft", label: "Foot" },
    { value: "yd", label: "Yard" },
    { value: "mi", label: "Mile" },
  ],
  Volume: [
    { value: "l", label: "Liter" },
    { value: "ml", label: "Milliliter" },
    { value: "gal", label: "Gallon" },
    { value: "qt", label: "Quart" },
    { value: "pt", label: "Pint" },
    { value: "cup", label: "Cup" },
    { value: "tbsp", label: "Tablespoon" },
    { value: "tsp", label: "Teaspoon" },
  ],
  Weight: [
    { value: "g", label: "Gram" },
    { value: "mg", label: "Milligram" },
    { value: "kg", label: "Kilogram" },
    { value: "t", label: "Tonne" },
    { value: "lb", label: "Pound" },
    { value: "oz", label: "Ounce" },
  ],
  Temperature: [
    { value: "˚C", label: "Celsius" },
    { value: "f", label: "Fahrenheit" },
    { value: "k", label: "Kelvin" },
  ],
  Density: [
    { value: "kg/m³", label: "kg/m³" },
    { value: "g/cm³", label: "g/cm³" },
    { value: "lb/ft³", label: "lb/ft³" },
    { value: "lb/in³", label: "lb/in³ " },
  ],
  Packing: [
    { value: "Plastic Bag", label: "Plastic Bag" },
    { value: "Wowan Bag", label: "Wowan Bag" },
    { value: "Branded Wowan Bag", label: "Branded Wowan Bag" },
    { value: "Corrugated Box", label: "Corrugated Box" },
    { value: "Branded Corrugated Box", label: "Branded Corrugated Box" },
  ],
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