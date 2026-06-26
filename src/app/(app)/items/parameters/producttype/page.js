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
    catagory: '',
    productType: '',
    productTypeId: '',
  });

  const [originalForm, setOriginalForm] = useState({
    catagory: '',
    productType: '',
    productTypeId: '',
  });

  const isCreateDirty = useMemo(() => {
    return Boolean(
      String(form.catagory || '').trim() ||
      String(form.productType || '').trim()
    );
  }, [form]);

  const isUpdateDirty = useMemo(() => {
    // console.log('isUpdateDirty', form, originalForm);
    return (
      (form.productType || '').trim() !== (originalForm.productType || '').trim() ||
      (form.catagory || '').trim() !== (originalForm.catagory || '').trim()
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
        key: 'catagory',
        header: 'Catagory',
        sortable: true,
        render: (r) => r?.catagoryID?.name || '—',
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
      catagory: '',
      productType: '',
      productTypeId: '',
    };

    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setMode('');
  };

  const openDialog = (data) => {
    const editForm = {
      catagory: data?.catagoryID?._id ?? '',
      productType: data?.name ?? '',
      productTypeId: data?._id ?? '',
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
      setProductType(prev => prev.filter(p => p.value !== id));
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
    console.log('update', form.productType, form.productTypeId);
    setUpdating(true);
    try {
      const ok = await Toast.promise(`Update "${form.productType}" productType? This will permanently Update the productType. Are you sure?`, {
        confirmText: 'Update',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      const payload = {
        _id: form.productTypeId,
        name: form.productType,
        catagoryID: form.catagory
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
    console.log('create :- ', form.catagory, form.productType);

    try {
      if (!form.catagory || !form.productType) {
        Toast.error('Please fill all the fields');
        return
      }
      // optimistic UI: remove from list first
      const payload = {
        catagoryID: form.catagory,
        productType: form.productType,
      }
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
        <div className='h-[300px]'>
          <SelectTypeInput
            value={form.catagory}
            label={'Category'}
            name={'catagory'}
            onChange={(e) => setForm(prev => ({ ...prev, catagory: e.target.value }))}
            apiget={"/api/category"}
            placeholder='Select Catagory'
            required
            autoFocus={mode === 'create' ? true : false}
          />
          <CustomInput
            value={form.productType}
            label={'Product Type'}
            name={'new_productType'}
            placeholder='Create new product type'
            onChange={(e) => {
              setForm(prev => ({
                ...prev,
                productType: e.target.value,
              }));
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}