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
import { mapDimension } from '@/utils/FGP';
import { Dimension_uom_options } from '@/config/Uom';

export default function Finished() {

  const { can } = useAuthz();

  // State
  const [dimension, setDimension] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState({
    productType: '',
    category: '',
    length: '',
    width: '',
    thickness: '',
    dimensionId: '',
    unit: '',
  });

  const [originalForm, setOriginalForm] = useState({
    productType: '',
    category: '',
    length: '',
    width: '',
    thickness: '',
    dimensionId: '',
    unit: '',
  });

  const isCreateDirty = useMemo(() => {
    return Boolean(
      String(form.productType || '').trim() ||
      String(form.category || '').trim() ||
      String(form.unit || '').trim() ||
      String(form.length || '').trim() ||
      String(form.width || '').trim() ||
      String(form.thickness || '').trim()
    );
  }, [form]);

  const isUpdateDirty = useMemo(() => {
    // console.log('isUpdateDirty', form, originalForm);
    return (
      (form.length || '') !== (originalForm.length || '') ||
      (form.width || '') !== (originalForm.width || '') ||
      (form.thickness || '') !== (originalForm.thickness || '') ||
      (form.productType || '') !== (originalForm.productType || '') ||
      (form.category || '') !== (originalForm.category || '') ||
      (form.unit || '').trim() !== (originalForm.unit || '').trim()
    );
  }, [form, originalForm]);

  // Data Fetching
  const fetchDimension = useCallback(async () => {
    setLoading(true);
    try {
      const dimensionRes = await axiosInstance.get('/api/dimensions');
      // console.log("dimensionRes :- ", dimensionRes);
      const dimensionData = dimensionRes.data || [];
      setDimension(dimensionData);
    } catch (err) {
      console.error('fetch error', err);
      setError(err?.message || 'Failed to load');
      Toast.error('Failed to fetch Dimensions', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDimension();
  }, [fetchDimension]);

  // Table Configuration
  const columns = useMemo(
    () => [
      {
        key: 'dimension',
        header: 'Dimension Value',
        sortable: true,
        render: (r) => mapDimension(r) ?? '—',
      },
      {
        key: 'uom',
        header: 'Dimension Unit',
        sortable: true,
        render: (r) => r?.unit || '—',
      },
      {
        key: 'productType',
        header: 'Product Type',
        sortable: true,
        render: (r) => r?.productType?.name || '—',
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        render: (r) => r?.category?.name || '—',
      },
      {
        key: 'action',
        header: 'Action',
        sortable: true,
        render: (r) => (
          <div className='flex gap-4'>
            {<EditButton onClick={() => openDialog(r)} requiredPermissions='parameters:dimensions:update' />}
            {<DeleteButton onClick={() => onDelete(r?.value, r?._id)} requiredPermissions='parameters:dimensions:delete' />}
          </div>
        )
      }
    ],
    []
  );

  // Dialog Helpers
  const resetDialogState = () => {
    const emptyForm = {
      length: '',
      width: '',
      thickness: '',
      dimensionId: '',
      unit: '',
      productType: '',
      category: '',
    };

    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setMode('');
  };

  const openDialog = (data) => {
    const editForm = {
      productType: data?.productType?._id ?? '',
      category: data?.category?._id ?? '',
      length: data?.length ?? '',
      width: data?.width ?? '',
      thickness: data?.thickness ?? '',
      dimensionId: data?._id ?? '',
      unit: data?.unit ?? '',
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
      setDimension(prev => prev.filter(p => p.value !== id));
      Toast.success('Dimension deleted');
      fetchDimension();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      Toast.error('Failed to delete item');
      // quick refetch to ensure state is consistent
      try {
        fetchDimension();
      } catch (e) { /* ignore */ }
    }
  };
  const handleSave = async () => {
    console.log('update', form.dimension, form.dimensionId);
    setUpdating(true);
    try {
      const ok = await Toast.promise(`Update "${form.length +" x "+ form.width +" x "+ form.thickness}" dimension? This will permanently Update the dimension. Are you sure?`, {
        confirmText: 'Update',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      const payload = {
        _id: form.dimensionId,
        unit: form.unit,
        length: form.length,
        width: form.width,
        thickness: form.thickness,
        category: form.category,
        productType: form.productType,
      }
      const res = await axiosInstance.put(`/api/dimensions`, payload);
      console.log("res :- ", res);
      Toast.success('Dimension Updated');
      setOriginalForm(form);
      resetDialogState();
      setOpen(false);
      fetchDimension();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update dimension");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Update dimension');
      // quick refetch to ensure state is consistent
      try {
        resetDialogState();
        setOpen(false);
      } catch (e) { /* ignore */ }
    } finally {
      setUpdating(false);
    }
  };
  const createDimension = async () => {
    setSaving(true);
    console.log('create :- ', form.productType, form.dimension);

    try {
      if (!form.productType || !form.length || !form.width || !form.thickness || !form.unit || !form.category) {
        Toast.error('Please fill all the fields');
        return
      }
      // optimistic UI: remove from list first
      const payload = {
        productType: form.productType,
        category: form.category,
        length: form.length,
        width: form.width,
        thickness: form.thickness,
        unit: form.unit
      }
      const res = await axiosInstance.post(`/api/dimensions`, payload);
      console.log("res :- ", res);
      Toast.success('Dimension Is Created');
      resetDialogState();
      setOpen(false);
      fetchDimension();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update Dimension");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Create dimension');
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
        data={dimension}
        virtualization={dimension.length > 200}
        loading={loading}
        // tableRef={stockTabelRef}
        className='overflow-y-auto'
      />
      <div className='py-2'>
        {can('parameters:dimensions:create') && <AddButton
          onClick={() => {
            resetDialogState();
            setMode('create');
            setOpen(true);
          }}
          title={'Create Dimension'}
        />}
      </div>

      <Dialog
        open={open}
        dialogHight='h-full'
        mode='create'
        title={mode === 'create' ? 'Create Dimension' : 'Update Dimension'}
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
              onClick={mode === 'create' ? createDimension : handleSave}
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
          <CustomInput
            value={form.length}
            label={'Dimension Length'}
            name={'length'}
            type='number'
            placeholder={mode === 'create' ? 'Create new Dimension' : 'Update Dimension'}
            onChange={(e) => {
              setForm(prev => ({
                ...prev,
                length: e.target.value,
              }));
            }}
            autoFocus
          />
          <CustomInput
            value={form.width}
            label={'Dimension Width'}
            name={'width'}
            type='number'
            placeholder={mode === 'create' ? 'Create new Dimension' : 'Update Dimension'}
            onChange={(e) => {
              setForm(prev => ({
                ...prev,
                width: e.target.value,
              }));
            }}
          />
          <CustomInput
            value={form.thickness}
            label={'Dimension Thickness'}
            name={'thickness'}
            type='number'
            placeholder={mode === 'create' ? 'Create new Dimension' : 'Update Dimension'}
            onChange={(e) => {
              setForm(prev => ({
                ...prev,
                thickness: e.target.value,
              }));
            }}
            
          />
          <SelectTypeInput
            value={form.unit}
            label={"Dimension Unit"}
            name={"unit"}
            onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
            placeholder={"select Dimension Unit"}
            options={Dimension_uom_options}
            required
          // autoFocus={mode === 'create' ? true : false}
          />
          <SelectTypeInput
            value={form.category}
            label={'Category'}
            name={'category'}
            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            apiget={"/api/category"}
            placeholder='Select product type'
            required
          // autoFocus={mode === 'create' ? true : false}
          />
          {form.category && <SelectTypeInput
            value={form.productType}
            label={'Product Type'}
            name={'productType'}
            onChange={(e) => setForm(prev => ({ ...prev, productType: e.target.value }))}
            apiget={"/api/product-type"}
            apiparams={form.category}
            placeholder='Select product type'
            required
          // autoFocus={mode === 'create' ? true : false}
          />}
        </div>
      </Dialog>
    </div>
  );
}