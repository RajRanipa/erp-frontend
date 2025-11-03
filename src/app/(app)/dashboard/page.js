// src/app/dashboard/page.js
'use client';
import SelectTypeInput from '@/components/inputs/SelectTypeInput';
// import SearchType from '@/components/inputs/SearchType';
import DisplayMain from '@/components/layout/DisplayMain';
import { useToast } from '@/components/toast';
import { useCallback, useState } from 'react';

const InventoryPage = () => {
  const toast = useToast();

  const [formData, SetFormData] = useState({
    category: 'Ceramics',
    category_label: '',
  });
  const categoryOptions = [
    { label: 'Metals', value: '11' },
    { label: 'Ceramics', value: '22' },
    { label: 'Polymers', value: '33' },
    { label: 'Composites', value: '44' },
  ];


  const onChange = (e) => {
    console.log('Selected value:',e, e.target.value);
  };

  return (
    <DisplayMain>
      <h2 className="text-2xl font-semibold">Inventory</h2>
      <p>All your product stock will show here.</p>
      <button
        onClick={() =>
          toast({
            type: "success",
            message: "Auto dismiss success!",
            duration: 4000,
            autoClose: true,
            placement: "top-right",
            animation: "right-left",
          })
        }
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-6"
      >
        Test Toast
      </button>
      <div className="mt-6 p-4 border border-gray-800 rounded-md bg-white-100">
        <h3 className="text-lg font-medium mb-2">Test SearchType Component</h3>
        <SelectTypeInput
          label="Category"
          placeholder="Category"
          name="category"
          value={formData.category}
          required
          allowCustomValue={false}
          options={categoryOptions}
          onChange={onChange}
        />
      </div>
    </DisplayMain>
  );
};

export default InventoryPage;