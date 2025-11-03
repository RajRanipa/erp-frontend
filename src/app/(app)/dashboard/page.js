// src/app/(app)/dashboard/page.js
'use client';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import DisplayMain from '@/Components/layout/DisplayMain';
import { Toast } from '@/Components/toast';
import { useState } from 'react';

const InventoryPage = () => {
  const [formData, setFormData] = useState({
    category: 'Ceramics',
    category_label: 'Ceramics',
    productType: '',
    productType_label: '',
  });

  const categoryOptions = [
    { label: 'Metals', value: '11' },
    { label: 'Ceramics', value: '22' },
    { label: 'Polymers', value: '33' },
    { label: 'Composites', value: '44' },
  ];

  const handleSelectChange = (e) => {
    // e.target.name, e.target.value, e.label
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // if SelectTypeInput sends label, save it too
      ...(e.label ? { [`${name}_label`]: e.label } : {}),
    }));
  };

  const clear = () => {
    console.log('clear');
    setFormData({
      category: '',
      category_label: '',
      productType: '',
      productType_label: '',
    });
    // when i run this function means i change value of formdata , okay ?
  };

  return (
    <DisplayMain>
      <h2 className="text-2xl font-semibold">Inventory</h2>
      <p>All your product stock will show here.</p>

      <button
        onClick={() => {
          Toast.success('Saved successfully!', {
            duration: 4000,
            placement: 'bottom-right',
          });
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-6"
      >
        Test Toast
      </button>

      <div className="mt-6 p-4 border border-gray-800 rounded-md bg-white-100">
        <h3 className="text-lg font-medium mb-2">Test SelectTypeInput Component</h3>
        <div className="flex gap-5 items-center justify-center">
          <SelectTypeInput
            label="Category"
            placeholder="Category"
            name="category"
            value={formData.category} // that means this one is change when i run clear function
            options={categoryOptions}
            onChange={handleSelectChange}
          />

          <SelectTypeInput
            label="Product Type"
            name="productType"
            id="productType"
            placeholder="Product Type"
            value={formData.productType} // that means this one is change when i run clear function 
            onChange={handleSelectChange}
            apiget="/api/product-type"
          />

          <button className="btn-primary h-fit" onClick={clear}>
            clean
          </button>
        </div>

        {/* just to see current value */}
        <pre className="mt-4 text-xs bg-slate-950/40 p-3 rounded">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </DisplayMain>
  );
};

export default InventoryPage;