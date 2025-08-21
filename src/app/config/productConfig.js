import api from "@/utils/api";


// {
//         key: "dimension",
//         label: "Dimension",
//         type:"selecttype",
//         name: "dimension",
//         placeholder: "Dimension",
//         required: true, 
//         apiget: '/api/dimension',
//     },
//     {
//         key: "density",
//         label: "Density",
//         type:"selecttype",
//         name: "density",
//         placeholder: "Density",
//         required: true, 
//         apiget: '/api/density',
//     },
//     {
//         key: "temperature",
//         label: "Temperature",
//         type:"selecttype",
//         name: "temperature",
//         placeholder: "Temperature",
//         required: true, 
//         apiget: '/api/temperature',
//     },
//     {   
//         key: "packing",
//         label: "Packing Material",
//         type:"selecttype",
//         name: "packing",
//         placeholder: "Packing Material",
//         required: true, 
//         apiget: '/api/packing',
//     },

const productParameters = [
    // {
    //     key: "dimension",
    //     label: "Dimension",
    //     fields: [
    //         { name: "length", placeholder: "Length", type: "number" },
    //         { name: "width", placeholder: "Width", type: "number" },
    //         { name: "thickness", placeholder: "Thickness", type: "number" },
    //     ],
    //     unitName: "dimensionunit",
    //     unitType: "Dimension",
    //     uniqueName: "dimensionunique",
    // },
    // {
    //     key: "density",
    //     label: "Density",
    //     fields: [
    //         { name: "density", placeholder: "Density", type: "number" },
    //     ],
    //     unitName: "densityunit",
    //     unitType: "Density",
    //     uniqueName: "densityunique",
    // },
    // {
    //     key: "temperature",
    //     label: "Temperature",
    //     fields: [
    //         { name: "temperature", placeholder: "Temperature", type: "number" },
    //     ],
    //     unitName: "temperatureunit",
    //     unitType: "Temperature",
    //     uniqueName: "temperatureunique",
    // },
    // {   
    //     key: "packing",
    //     label: "Packing Material",
    //     fields: [
    //         // { name: "packing", placeholder: "Packing", type: "number", value: 1, readonly: true },
    //     ],
    //     unitName: "packingunit",
    //     unitType: "Packing",
    //     uniqueName: "packingunique",
    // },
    {
        key: "dimension",
        label: "Dimension",
        type:"selecttype",
        name: "dimension",
        placeholder: "Dimension",
        required: true, 
        apiget: '/api/dimension',
    },
    {
        key: "density",
        label: "Density",
        type:"selecttype",
        name: "density",
        placeholder: "Density",
        required: true, 
        apiget: '/api/density',
    },
    {
        key: "temperature",
        label: "Temperature",
        type:"selecttype",
        name: "temperature",
        placeholder: "Temperature",
        required: true, 
        apiget: '/api/temperature',
    },
    {   
        key: "packing",
        label: "Packing Material",
        type:"selecttype",
        name: "packing",
        placeholder: "Packing Material",
        required: true, 
        apiget: '/api/packing',
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
    },
];

const coreProductFields = [
    {
        type: 'selecttype', name: 'productType', placeholder: 'Product Type', required: true, 
        apiget: '/api/product-type', apipost: '/api/product-type',
        conditional: (formData) => {
            return (formData.category_label.toLowerCase() === 'finished' || formData.category_label.toLowerCase() === 'packing')
        }
    },
    { type: 'text', name: 'productName', placeholder: 'Product Name', required: true },
    {
        type: 'select', name: 'brandType', placeholder: 'Brand Type', options: [
            { value: "branded", label: "branded" },
            { value: "plain", label: "plain" },
        ], conditional: (formData) => formData.category_label.toLowerCase().includes('packing') 
    },
    { type: 'text', name: 'productColor', placeholder: 'Product Color', required: false, conditional: (formData) => formData.category_label.toLowerCase().includes('packing') },
    { type: 'number', name: 'purchasePrice', placeholder: 'Purchase Price', required: false, conditional: (formData) => formData.category_label.toLowerCase().includes('raw') || formData.category_label.toLowerCase() === 'packing' },
    { type: 'number', name: 'salePrice', placeholder: 'Sale Price', required: false, conditional: (formData) => formData.category_label.toLowerCase().includes('finished') },
    {
        type: 'select', name: 'product_unit', placeholder: 'Product Unit', required: true,
        options: [
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
    { type: 'number', name: 'currentStock', placeholder: 'Current Stock', required: false },
    { type: 'number', name: 'minimumStock', placeholder: 'Minimum Stock Level', required: false },
    { type: 'textarea', name: 'description', placeholder: 'Description', required: false },
];
const packingFields = [
    // {
    //     type: 'select', name: 'category', placeholder: 'Category', required: true, options: [
    //         { value: "packing", label: "Packing Material" },
    //         { value: "raw", label: "Raw Material" },
    //         { value: "finished", label: "Finished Goods" }
    //     ]
    // },
    {
        type: 'select', name: 'productType', placeholder: 'Product Type', required: true, options: [
            { value: "blanket", label: "blanket" },
            { value: "bulk", label: "bulk" },
            { value: "board", label: "board" },
            { value: "module", label: "module" }
        ], conditional: (formData) => formData.category_label.toLowerCase().includes('finished') 
    },
    { type: 'text', name: 'productName', placeholder: 'Product Name', required: true },
    {
        type: 'select', name: 'brandType', placeholder: 'Brand Type', required: true, options: [
            { value: "branded", label: "blanket" },
            { value: "plain", label: "bulk" },
        ], conditional: (formData) => formData.category_label.toLowerCase().includes('packing') 
    },
    // { type: 'text', name: 'category', placeholder: 'Category', required: false },
    { type: 'number', name: 'purchasePrice', placeholder: 'Purchase Price', required: false, conditional: (formData) => formData.category_label.toLowerCase().includes('raw') || formData.category_label.toLowerCase() === 'packing' },
    { type: 'number', name: 'salePrice', placeholder: 'Sale Price', required: false, conditional: (formData) => formData.category_label.toLowerCase().includes('finished') },
    {
        type: 'select', name: 'product_unit', placeholder: '', required: true,
        options: [
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
    { type: 'number', name: 'currentStock', placeholder: 'Current Stock', required: false },
    { type: 'number', name: 'minimumStock', placeholder: 'Minimum Stock Level', required: false },
    { type: 'textarea', name: 'description', placeholder: 'Description', required: false },
];

export { productParameters, coreProductFields };