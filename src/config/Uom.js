// src/app/config/productConfig.js

const Temp_uom_options = [
    { value: "˚C", label: "Celsius" },
    { value: "f", label: "Fahrenheit" },
    { value: "k", label: "Kelvin" },
]

const Density_uom_options = [
    { value: "kg/m³", label: "kg/m³" },
    { value: "g/cm³", label: "g/cm³" },
    { value: "lb/ft³", label: "lb/ft³" },
    { value: "lb/in³", label: "lb/in³ " },
]

const Dimension_uom_options = [
    { value: "mm", label: "Millimeter" },
    { value: "cm", label: "Centimeter" },
    { value: "m", label: "Meter" },
    { value: "km", label: "Kilometer" },
    { value: "in", label: "Inch" },
    { value: "ft", label: "Foot" },
    { value: "yd", label: "Yard" },
    { value: "mi", label: "Mile" },
]

const Volume_uom_options = [
    { value: "l", label: "Liter" },
    { value: "ml", label: "Milliliter" },
    { value: "gal", label: "Gallon" },
    { value: "qt", label: "Quart" },
    { value: "pt", label: "Pint" },
    { value: "cup", label: "Cup" },
    { value: "tbsp", label: "Tablespoon" },
    { value: "tsp", label: "Teaspoon" },
]

const Weight_uom_options = [
    { value: "g", label: "Gram" },
    { value: "mg", label: "Milligram" },
    { value: "kg", label: "Kilogram" },
    { value: "t", label: "Tonne" },
    { value: "lb", label: "Pound" },
    { value: "oz", label: "Ounce" },
]

const Packing_uom_options = [
    { value: "g", label: "Gram" },
    { value: "mg", label: "Milligram" },
    { value: "kg", label: "Kilogram" },
    { value: "t", label: "Tonne" },
    { value: "lb", label: "Pound" },
    { value: "oz", label: "Ounce" },
]


export { Temp_uom_options, Density_uom_options, Dimension_uom_options, Volume_uom_options, Weight_uom_options, Packing_uom_options };