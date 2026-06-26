// src/app/items/finished/page.js
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import EditButton from '@/Components/buttons/EditButton';
import DeleteButton from '@/Components/buttons/DeleteButton';
// import StatusActions from '../components/StatusActions';
import Loading from '@/Components/Loading';
import useAuthz from '@/hooks/useAuthz';
import Dialog from '@/Components/Dialog';
import SubmitButton from '@/Components/buttons/SubmitButton';
import AddButton from '@/Components/buttons/AddButton';
import Table from '@/Components/layout/Table.jsx';

export default function Finished() {

  const { can } = useAuthz();

  const [category, setCatagory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('');
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    category: '',
    categoryId: '',
  });

  const [originalForm, setOriginalForm] = useState({
    category: '',
    categoryId: '',
  });

  const isUpdateDirty = useMemo(() => {
    return String(form.category || '').trim() !== String(originalForm.category || '').trim();
  }, [form, originalForm]);

  const isCreateDirty = useMemo(() => {
    return Boolean(String(form.category || '').trim());
  }, [form]);

  const fetchCatagory = useCallback(async () => {
    setLoading(true);
    try {
      const categoryRes = await axiosInstance.get('/api/category');
      const categoryData = categoryRes.data || [];
      setCatagory(categoryData);
      console.log("categoryData :- ", categoryData);
    } catch (err) {
      console.error('fetch error', err);
      setError(err?.message || 'Failed to load');
      Toast.error('Failed to fetch items', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatagory();
  }, [fetchCatagory]);

  const columns = useMemo(
  () => [
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (r) => r?.label || '—',
    },

    ...(can('parameters:categories:update') ||
       can('parameters:categories:delete')
      ? [{
          key: 'action',
          header: 'Action',
          sortable: false,
          render: (r) => (
            <div className='flex gap-4'>
              <EditButton
                onClick={() => {
                  openDialog(r.label, r.value);
                  setMode('edit');
                }}
                requiredPermissions='parameters:categories:update'
              />
              <DeleteButton
                onClick={() => onDelete(r.label, r.value)}
                requiredPermissions='parameters:categories:delete'
              />
            </div>
          )
        }]
      : [])
  ],
  [can]
);

  const resetDialogState = () => {
    const emptyForm = {
      category: '',
      categoryId: '',
    };

    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setMode('');
  };

  const openDialog = (category, id) => {
    const editForm = {
      category,
      categoryId: id,
    };

    setForm(editForm);
    setOriginalForm(editForm);
    setOpen(true);
  };

  const onDelete = async (name, id, triggerEl) => {
    console.log('delete', name, id);
    try {
      const ok = await Toast.promise(`Delete "${name}" category? This will permanently delete the item. Are you sure?`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      await axiosInstance.delete(`/api/category/${id}`, { withCredentials: true });
      setCatagory(prev => prev.filter(p => p.value !== id));
      Toast.success('Category deleted');
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      Toast.error('Failed to delete Category');
      // quick refetch to ensure state is consistent
      try {
        const resp = await axiosInstance.get('/api/category');
        setCatagory(resp.data || []);
      } catch (e) { /* ignore */ }
    }
  };

  const createCategory = async () => {
    setSaving(true);

    try {
      if (!form.category?.trim()) {
        Toast.error('Please enter category name');
        return;
      }

      const payload = {
        category: form.category,
      };

      await axiosInstance.post('/api/category', payload);

      Toast.success('Category Created');
      await fetchCatagory();

      resetDialogState();
      setOpen(false);
    } catch (err) {
      Toast.error(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    console.log('update', form.category, form.categoryId);
    setUpdating(true);
    try {
      const ok = await Toast.promise(`Update "${form.category}" category? This will permanently Update the category. Are you sure?`, {
        confirmText: 'Update',
        cancelText: 'Cancel',
      });
      if (!ok) return;
      // optimistic UI: remove from list first
      const payload = {
        categoryId: form.categoryId,
        category: form.category,
      }
      const res = await axiosInstance.put(`/api/category`, payload);
      console.log("res :- ", res);
      Toast.success('Category Updated');
      setOriginalForm(form);
      await fetchCatagory();
      resetDialogState();
      setOpen(false);
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      if(err?.response?.statusText){
        if(err?.response?.statusText === 'Forbidden'){
          Toast.error("You don't have permission to update category");
          return;
        }
        Toast.error(err?.response?.data?.message);
      }
      Toast.error('Failed to Update category');
      // quick refetch to ensure state is consistent
      try {
        // const resp = await axiosInstance.get('/api/items/finished');
        resetDialogState();
        setOpen(false);
      } catch (e) { /* ignore */ }
    }finally{
      setUpdating(false);
    }
  };

  return (
    <div className="Items-page w-full flex flex-col">
      {loading && <Loading variant='skeleton' className='h-full' />}
      <Table
        columns={columns}
        data={category}
        rowKey={(r) => r.value}
        virtualization={category.length > 200}
        loading={loading}
        className='overflow-y-auto'
      />

      <div className='py-2'>
        {can('parameters:categories:create') && <AddButton
          title={'Create Category'}
          onClick={() => {
            resetDialogState();
            setMode('create');
            setOpen(true);
          }}
        />}
      </div>

      <Dialog
        open={open}
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
        onClose={() => {
          resetDialogState();
          setOpen(false);
        }}
        side="right"
        size="sm"
        actions={(
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
              type='button'
              onClick={mode === 'create' ? createCategory : handleSave}
              disabled={mode === 'create' ? !isCreateDirty : (updating || !isUpdateDirty)}
              loading={mode === 'create' ? saving : updating}
            >
              {mode === 'create'
                ? (saving ? 'Creating...' : 'Create')
                : (updating ? 'Updating...' : 'Update')}
            </SubmitButton>
          </>
        )}
      >
        <CustomInput
          value={form.category}
          label={'category'}
          name={'active_category'}
          placeholder='type a catagory name'
          id={form.categoryId}
          onChange={(e) => {
            setForm(prev => ({
              ...prev,
              category: e.target.value,
            }));
          }}
        />
      </Dialog>
    </div>
  );
}