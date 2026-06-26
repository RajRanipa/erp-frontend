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
import { coreProductFields, Temp_uom_options } from '@/config/productConfig';

export default function Finished() {

  const { can } = useAuthz();

  // State
  const [temperature, setTemperature] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState({
    productType: '',
    temperature: '',
    temperatureId: '',
    unit: '',
  });

  const [originalForm, setOriginalForm] = useState({
    productType: '',
    temperature: '',
    temperatureId: '',
    unit  : '',
  });

  const isCreateDirty = useMemo(() => {
    return Boolean(
      String(form.productType || '').trim() ||
      String(form.unit || '').trim() ||
      String(form.temperature || '').trim()
    );
  }, [form]);

  const isUpdateDirty = useMemo(() => {
    // console.log('isUpdateDirty', form, originalForm);
    return (
      (form.temperature || '') !== (originalForm.temperature || '') ||
      (form.productType || '') !== (originalForm.productType || '') ||
      (form.unit || '').trim() !== (originalForm.unit || '').trim()
    );
  }, [form, originalForm]);

  // Data Fetching
  const fetchTemperature = useCallback(async () => {
    setLoading(true);
    try {
      const temperatureRes = await axiosInstance.get('/api/temperatures');
      console.log("temperatureRes :- ", temperatureRes);
      const temperatureData = temperatureRes.data || [];
      setTemperature(temperatureData);
    } catch (err) {
      console.error('fetch error', err);
      setError(err?.message || 'Failed to load');
      Toast.error('Failed to fetch Temperatures', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemperature();
  }, [fetchTemperature]);

  // Table Configuration
  const columns = useMemo(
    () => [
      {
        key: 'temperature',
        header: 'Temperature',
        sortable: true,
        render: (r) => r?.value || '—',
      },
      {
        key: 'uom',
        header: 'Unit',
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
        key: 'action',
        header: 'Action',
        sortable: true,
        render: (r) => (
          <div className='flex gap-4'>
            {<EditButton onClick={() => openDialog(r)} requiredPermissions='parameters:temperatures:update' />}
            {<DeleteButton onClick={() => onDelete(r?.value, r?._id)} requiredPermissions='parameters:temperatures:delete' />}
          </div>
        )
      }
    ],
    []
  );

  // Dialog Helpers
  const resetDialogState = () => {
    const emptyForm = {
      temperature: '',
      temperatureId: '',
      unit: '',
      productType: '',
    };

    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setMode('');
  };

  const openDialog = (data) => {
    const editForm = {
      productType: data?.productType?._id ?? '',
      temperature: data?.value ?? '',
      temperatureId: data?._id ?? '',
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
      setTemperature(prev => prev.filter(p => p.value !== id));
      Toast.success('Temperature deleted');
      fetchTemperature();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      Toast.error('Failed to delete item');
      // quick refetch to ensure state is consistent
      try {
        fetchTemperature();
      } catch (e) { /* ignore */ }
    }
  };
  const handleSave = async () => {
    console.log('update', form.temperature, form.temperatureId);
    setUpdating(true);
    try {
      const ok = await Toast.promise(`Update "${form.temperature}" temperature? This will permanently Update the temperature. Are you sure?`, {
        confirmText: 'Update',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      const payload = {
        unit: form.unit,
        value: form.temperature,
        productType: form.productType,
      }
      const res = await axiosInstance.put(`/api/temperatures/${form.temperatureId}`, payload);
      console.log("res :- ", res);
      Toast.success('Temperature Updated');
      setOriginalForm(form);
      resetDialogState();
      setOpen(false);
      fetchTemperature();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update temperature");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Update temperature');
      // quick refetch to ensure state is consistent
      try {
        resetDialogState();
        setOpen(false);
      } catch (e) { /* ignore */ }
    } finally {
      setUpdating(false);
    }
  };
  const createTemperature = async () => {
    setSaving(true);
    console.log('create :- ', form.productType, form.temperature);

    try {
      if (!form.productType || !form.temperature) {
        Toast.error('Please fill all the fields');
        return
      }
      // optimistic UI: remove from list first
      const payload = {
        productType: form.productType,
        value: form.temperature,
        unit: form.unit
      }
      const res = await axiosInstance.post(`/api/temperatures`, payload);
      console.log("res :- ", res);
      Toast.success('Temperature Is Created');
      resetDialogState();
      setOpen(false);
      fetchTemperature();
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if (err?.response?.statusText) {
        if (err?.response?.statusText === 'Forbidden') {
          Toast.error("You don't have permission to update Temperature");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Create temperature');
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
        data={temperature}
        virtualization={temperature.length > 200}
        loading={loading}
        // tableRef={stockTabelRef}
        className='overflow-y-auto'
      />
      <div className='py-2'>
        {can('parameters:temperatures:create') &&<AddButton
          onClick={() => {
            resetDialogState();
            setMode('create');
            setOpen(true);
          }}
          title={'Create Temperature'}
        />}
      </div>

      <Dialog
        open={open}
        mode='create'
        title={mode === 'create' ? 'Create Temperature' : 'Update Temperature'}
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
              onClick={mode === 'create' ? createTemperature : handleSave}
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
          <CustomInput
            value={form.temperature}
            label={'Temperature'}
            name={'new_temperature'}
            type='number'
            placeholder={mode === 'create' ? 'Create new Temperature' : 'Update Temperature'}
            onChange={(e) => {
              setForm(prev => ({
                ...prev,
                temperature: e.target.value,
              }));
            }}
            autoFocus
          />
          <SelectTypeInput
            value={form.unit}
            label={"Temperature Unit"}
            name={"unit"}
            onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
            placeholder={"select Temperature Unit"}
            options={Temp_uom_options}
            required
            // autoFocus={mode === 'create' ? true : false}
          />
          <SelectTypeInput
            value={form.productType}
            label={'Product Type'}
            name={'productType'}
            onChange={(e) => setForm(prev => ({ ...prev, productType: e.target.value }))}
            apiget={"/api/product-type/options"}
            placeholder='Select product type'
            required
            // autoFocus={mode === 'create' ? true : false}
          />
        </div>
      </Dialog>
    </div>
  );
}