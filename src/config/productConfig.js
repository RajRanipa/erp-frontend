import api from "../utils/api";
// src/app/config/productConfig.js

const productParameters = [
    {
        key: "dimension",
        label: "Dimension",
        type: "selecttype",
        name: "dimension",
        placeholder: "Dimension",
        required: true,
        apiget: '/api/dimension',
        conditional: true
    },
    {
        key: "density",
        label: "Density",
        type: "selecttype",
        name: "density",
        placeholder: "Density",
        required: true,
        apiget: '/api/density',
        conditional: false
    },
    {
        key: "temperature",
        label: "Temperature",
        type: "selecttype",
        name: "temperature",
        placeholder: "Temperature",
        required: true,
        apiget: '/api/temperature',
        conditional: false
    },
    {
        key: "packing",
        label: "Packing Material",
        type: "selecttype",
        name: "packing",
        placeholder: "Packing Material",
        required: true,
        apiget: '/api/items/packings',
        conditional: false
    },
    {
        key: "weight",
        label: "Weight",
        fields: [
            { name: "weight", placeholder: "Weight", type: "number" },
        ],
        unitName: "weightunit",
        unitType: "Weight",
        uniqueName: "weightunique",
        conditional: false
    },
    {
        key: "volume",
        label: "Volume",
        fields: [
            { name: "volume", placeholder: "Volume", type: "number" },
        ],
        unitName: "volumeunit",
        unitType: "Volume",
        uniqueName: "volumeunique",
        conditional: false
    },
];

const coreProductFields = [
    {
        type: 'selecttype', name: 'productType', label: 'Product Type', placeholder: 'Product Type', required: true,
        apiget: '/api/product-type', apipost: '/api/product-type',
        conditional: (formData = {}) => {
            const cat = String((formData.category_label ?? '')).trim().toLowerCase();
            return cat.includes('finished') || cat.includes('packing');
        }
    },
    {
        type: 'selecttype', name: 'name', label: 'Product Name', placeholder: 'Product Name', required: true, allowCustomValue: true,
        finished: [
            { value: "orewool blanket", label: "orewool Blanket" },
            { value: "orewool board", label: "orewool Board" },
            { value: "orewool bulk", label: "orewool Bulk" },
            { value: "orewool module", label: "orewool Module" },
            { value: "blanket strip", label: "Blanket Strip" }],
        packing: [
            { value: "plastic bag", label: "Plastic Bag" },
            { value: "wovan bag", label: "Wovan Bag" },
            { value: "corrugated box", label: "Corrugated Box" },
            { value: "cello tape", label: "Cello Tape" },
            { value: "stepping roll", label: "Stepping Roll" }],
        raw: [
            { value: "calcined alumina", label: "Calcined Alumina" },
            { value: "silica", label: "Silica" },
            { value: "Colloidal silica", label: "Colloidal Silica" },
            { value: "starch", label: "Starch" },
        ]
    },
    {
        type: 'selecttype', name: 'UOM', label: 'Product Unit', placeholder: 'Product Unit', required: true,
        options: [
            { value: "roll", label: "Roll" },
            { value: "nos", label: "Nos" },
            { value: "pcs", label: "Pcs" },
            { value: "kg", label: "Kg" },
            { value: "ton", label: "Ton" },
            { value: "ml", label: "Milliliter" },
            { value: "cm", label: "Centimeter" },
            { value: "m", label: "Meter" },
            { value: "km", label: "Kilometer" },
            { value: "in", label: "Inch" },
            { value: "ft", label: "Foot" },
            { value: "yd", label: "Yard" },
            { value: "mi", label: "Mile" },
            { value: "l", label: "Liter" },
            { value: "gal", label: "Gallon" },
            { value: "qt", label: "Quart" },
            { value: "pt", label: "Pint" },
            { value: "cup", label: "Cup" },
            { value: "tbsp", label: "Tablespoon" },
            { value: "tsp", label: "Teaspoon" },
            { value: "oz", label: "Ounce" },
            { value: "lb", label: "Pound" },
        ]
    },
    { type: 'number', name: 'minimumStock', label: 'Minimum Stock Level', placeholder: 'Minimum Stock Level', required: true },
    {
        type: 'select', name: 'brandType', label: 'Brand Type', placeholder: 'Brand Type', options: [
            { value: "branded", label: "branded" },
            { value: "plain", label: "plain" },
        ], conditional: (formData = {}) => {
            const cat = String((formData.category_label ?? '')).trim().toLowerCase();
            return cat.includes('packing');
        }
    },
    {
        type: 'text', name: 'productColor', label: 'Product Color', placeholder: 'Product Color', required: false, conditional: (formData = {}) => {
            const cat = String((formData.category_label ?? '')).trim().toLowerCase();
            return cat.includes('packing');
        }
    },
    // {
    //     type: 'number', name: 'purchasePrice', label: 'Purchase Price', placeholder: 'Purchase Price', required: false, conditional: (formData = {}) => {
    //         const cat = String((formData.category_label ?? '')).trim().toLowerCase();
    //         return cat.includes('raw') || cat.includes('packing');
    //     }
    // },
    // {
    //     type: 'number', name: 'salePrice', label: 'Sale Price', placeholder: 'Sale Price', required: false, conditional: (formData = {}) => {
    //         const cat = String((formData.category_label ?? '')).trim().toLowerCase();
    //         return cat.includes('finished');
    //     }
    // },
    // { type: 'number', name: 'currentStock', label: 'Current Stock', placeholder: 'Current Stock', required: false },
    {
        type: 'text',
        name: 'grade',
        label: 'Grade',
        placeholder: 'Grade',
        required: false,
        conditional: (formData = {}) => {
            const cat = String((formData.category_label ?? '')).trim().toLowerCase();
            return cat.includes('raw') || cat.includes('finished') || cat.includes('packing');
        }
    },
    { type: 'textarea', name: 'description', label: 'Description', placeholder: 'Description', required: false },
];

export { productParameters, coreProductFields };