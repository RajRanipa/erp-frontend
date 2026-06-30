// src/app/items/finished/page.js
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import EditButton from '@/Components/buttons/EditButton';
import DeleteButton from '@/Components/buttons/DeleteButton';
import Table from '@/Components/layout/Table.jsx';
// import StatusActions from '../components/StatusActions';
import Loading from '@/Components/Loading';
import useAuthz from '@/hooks/useAuthz';
import Dialog from '@/Components/Dialog';
import SubmitButton from '@/Components/buttons/SubmitButton';
import AddButton from '@/Components/buttons/AddButton';
import { addIcon } from '@/utils/SVG';


export default function Finished() {

  const { can } = useAuthz();

  // State
  const [productType, setProductType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState({
    name: '',
    categories: [],
    productType: '',
  });

  const [originalForm, setOriginalForm] = useState({
    name: '',
    categories: [],
    productType: '',
  });

  const addCategoryField = () => {
    setForm(prev => ({
      ...prev,
      categories: [...prev.categories, ''],
    }));
  };

  const removeCategoryField = (index) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const updateCategoryField = (index, value) => {
    setForm(prev => {
      const categories = [...prev.categories];
      categories[index] = value;

      return {
        ...prev,
        categories,
      };
    });
  };

  const isCreateDirty = useMemo(() => {
    return Boolean(
      JSON.stringify(form.categories.filter(Boolean)) !==
      JSON.stringify(originalForm.categories.filter(Boolean)) ||
      form.name.trim() !== ''
    );
  }, [form]);

  const isUpdateDirty = useMemo(() => {
    return (
      form.productType !== originalForm.productType ||
      JSON.stringify(form.categories.filter(Boolean)) !==
      JSON.stringify(originalForm.categories.filter(Boolean))
    );
  }, [form, originalForm]);

  // Data Fetching
  const fetchProductTypes = useCallback(async () => {
    setLoading(true);
    try {
      const productTypeRes = await axiosInstance.get('/api/product-type');
      console.log("productTypeRes :- ", productTypeRes.data);
      const productTypeData = productTypeRes.data || [];
      setProductType(productTypeData);
    } catch (err) {
      console.error('fetch error', err);
      setError(err?.message || 'Failed to load');
      Toast.error('Failed to fetch Product Types', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  // Table Configuration
  const columns = useMemo(
    () => [
      {
        key: 'producttype',
        header: 'Product Type',
        sortable: true,
        render: (r) => r?.name || '—',
      },
      {
        key: 'categories',
        header: 'Catagory',
        sortable: true,
        render: (r) =>
          r?.categories?.length
            ? r.categories.map(c => c.name).join(', ')
            : '—'
      },
      {
        key: 'action',
        header: 'Action',
        sortable: true,
        render: (r) => (
          <div className='flex gap-4'>
            {<EditButton onClick={() => openDialog(r)} requiredPermissions='parameters:producttypes:update' />}
            {<DeleteButton onClick={() => onDelete(r?.name, r?._id)} requiredPermissions='parameters:producttypes:delete' />}
          </div>
        )
      }
    ],
    []
  );

  // Dialog Helpers
  const resetDialogState = () => {
    const emptyForm = {
      name: '',
      categories: [''],
      productType: '',

    };

    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setMode('');
  };

  const openDialog = (data) => {
    const editForm = {
      categories: data?.categories?.map(c => c._id) ?? [''],
      name: data?.name ?? '',
      productType: data?._id ?? '',
    };

    setForm(editForm);
    setOriginalForm(editForm);
    setOpen(true);
    setMode('edit');
  };

  // CRUD Actions
  const onDelete = async (name, id, triggerEl) => {
    // console.log('delete', name, id);
    try {
      const ok = await Toast.promise(`Delete "${name}" product type? This will permanently delete the item. Are you sure?`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      await axiosInstance.delete(`/api/product-type/${id}`, { withCredentials: true });
      setProductType(prev => prev.filter(p => p._id !== id));
      Toast.success('Product Type deleted');
      fetchProductTypes();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      Toast.error('Failed to delete item');
      // quick refetch to ensure state is consistent
      try {
        fetchProductTypes();
      } catch (e) { /* ignore */ }
    }
  };
  const handleSave = async () => {
    console.log('update', form.productType, form.productType);
    setUpdating(true);
    try {
      const validCategories = form.categories.filter(Boolean);

      if (validCategories.length === 0 || !form.productType) {
        Toast.error('Please fill all the fields');
        return;
      }

      const ok = await Toast.promise(`Update "${form.productType}" productType? This will permanently Update the productType. Are you sure?`, {
        confirmText: 'Update',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      const payload = {
        _id: form.productType,
        name: form.name,
        categories: validCategories
      }
      const res = await axiosInstance.put(`/api/product-type`, payload);
      console.log("res :- ", res);
      Toast.success('Product Type Updated');
      setOriginalForm(form);
      resetDialogState();
      setOpen(false);
      fetchProductTypes();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update productType");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Update productType');
      // quick refetch to ensure state is consistent
      try {
        resetDialogState();
        setOpen(false);
      } catch (e) { /* ignore */ }
    } finally {
      setUpdating(false);
    }
  };
  const createProductType = async () => {
    setSaving(true);
    console.log('create :- ', form.categories, form.productType);

    try {
      const validCategories = form.categories.filter(Boolean);

      if (validCategories.length === 0 || !form.productType) {
        Toast.error('Please fill all the fields');
        return;
      }
      // optimistic UI: remove from list first
      const payload = {
        categories: validCategories,
        name: form.name,
        productType: form.productType,
      }
      console.log("payload :- ", form);
      // return;
      const res = await axiosInstance.post(`/api/product-type`, payload);
      console.log("res :- ", res);
      Toast.success('Product Type Is Created');
      resetDialogState();
      setOpen(false);
      fetchProductTypes();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update Product Type");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Create productType');
      // quick refetch to ensure state is consistent
      try {
        resetDialogState();
        setOpen(false);
      } catch (e) { /* ignore */ }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="Items-page w-full flex flex-col">
      {loading && <Loading variant='skeleton' className='h-full' />}
      <Table
        columns={columns}
        data={productType}
        virtualization={productType.length > 200}
        loading={loading}
        // tableRef={stockTabelRef}
        className='overflow-y-auto'
      />
      <div className='py-2'>
        {can('parameters:producttypes:create') && <AddButton
          onClick={() => {
            resetDialogState();
            setMode('create');
            setOpen(true);
          }}
          title={'Create Product Type'}
        />}
      </div>

      <Dialog
        open={open}
        dialogHight='h-full'
        mode='create'
        title={mode === 'create' ? 'Create Product Type' : 'Update Product Type'}
        onClose={() => {
          resetDialogState();
          setOpen(false);
        }}
        side="right"
        size="sm"
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                resetDialogState();
                setOpen(false);
              }}
            >
              Cancel
            </button>
            <SubmitButton
              type="button"
              onClick={mode === 'create' ? createProductType : handleSave}
              loading={mode === 'create' ? saving : updating}
              disabled={mode === 'create' ? !isCreateDirty : !isUpdateDirty}
            >
              {mode === 'create'
                ? (saving ? 'Creating...' : 'Create')
                : (updating ? 'Updating...' : 'Update')}
            </SubmitButton>
          </>
        }
      >
        <div className='min-h-[300px]'>
          <SelectTypeInput
            value={form.productType}
            label={'Product Type'}
            name={'productType'}
            onChange={(e) => { setForm(prev => ({ ...prev, name: e.label.value, productType: e.target.value })) }}
            apiget={"/api/product-type/options"}
            placeholder='Select Product Type'
            required
            allowCustomValue={true}
          // autoFocus={mode === 'create' ? true : false} 
          />
          <span className='text-sm text-white-300 block pb-3'>Note : you can assign multiple categories to one product type so as per your requiremrnt you can update below </span>
          <div className="space-y-3">

            {form.categories.map((category, index) => (
              <div
                key={index}
                className="flex gap-2 items-center justify-end"
              >
                <div className="flex-1">
                  <SelectTypeInput
                    value={category}
                    label={index === 0 ? 'Category' : `Category ${index + 1}`}
                    name={`category-${index}`}
                    apiget="/api/category"
                    placeholder="Select Category"
                    required
                    onChange={(e) =>
                      updateCategoryField(index, e.target.value)
                    }
                  />
                </div>

                {form.categories.length > 1 && (
                  <DeleteButton
                    type="button"
                    className="btn btn-danger mb-5"
                    onClick={() => removeCategoryField(index)}
                  >
                    Delete
                  </DeleteButton>
                )}
              </div>
            ))}

            <AddButton
              onClick={addCategoryField}
              title={'Add Category'}
            />
          </div>

        </div>
      </Dialog>
    </div>
  );
}