// src/app/(app)/items/raw/page.js
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import EditButton from '@/Components/buttons/EditButton';
import DeleteButton from '@/Components/buttons/DeleteButton';
import { useRouter } from 'next/navigation';
import Table from '@/Components/layout/Table';
import useAuthz from '@/hooks/useAuthz';
import StatusActions from '../components/StatusActions';
import NavLink from '@/Components/NavLink';
import Loading from '@/Components/Loading';
import { searchIcon } from '@/utils/SVG';
import { formatDateDMY } from '@/utils/date';

export default function Raw() {

  const { can } = useAuthz();
  // const confirmToast = useConfirmToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState([]);
  const router = useRouter();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/items/raw');
      setItems(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch raw items', err);
      setError(err?.message || 'Failed to fetch items');
      Toast.error('Failed to fetch raw items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter(it => {
      const name = it.name?.toLowerCase() || '';
      const grade = it.grade?.toLowerCase() || '';
      const unit = it.UOM?.toLowerCase() || '';
      const desc = it.description?.toLowerCase() || '';
      return (
        name.includes(lower) ||
        grade.includes(lower) ||
        unit.includes(lower) ||
        desc.includes(lower)
      );
    });
  }, [items, search]);

  const onEdit = (item) => {
    router.push(`/items/edit/${item._id}`);
  };

  const onDelete = async (name, id, triggerEl) => {
    try {
      const ok = await Toast.promise(`Delete ${name} ? This will permanently delete the item. Are you sure?`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        focusTarget: triggerEl,
      });
      if (!ok) return;

      // optimistic UI
      setItems(prev => prev.filter(p => p._id !== id));
      await axiosInstance.delete(`/api/items/${id}`, { withCredentials: true });
      Toast.success('Item deleted');
    } catch (err) {
      console.error('delete failed', err);
      Toast.error('Failed to delete item');
      // simple refetch to restore
      try {
        await fetchItems();
      } catch (e) {
        // ignore secondary failures
      }
    }
  };

  return (
    <>
      {<div>
        <div className="Items-page h-full flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-h2 font-semibold mb-5">Raw Materials</h1>
            <div className="flex gap-2 items-center">
              {loading ? <Loading variant='skeleton' className='h-9' /> :
                (items && items.length > 0) &&<>
                <button
                  type="button"
                  onClick={fetchItems}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2 mb-5 px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>↻</span>
                  <span>Refresh</span>
                </button>
                <CustomInput
                  name="search_items"
                  placeholder="Search name / grade / unit"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={searchIcon()}
                  parent_className="min-w-[280px] w-fit"
                />
                </>}
            </div>
          </div>

          {loading && <Loading variant='skeleton' className='h-full' />}
          {error && <p>Error: {error}</p>}
          {/* { can('items:status:update') && (
            
          )} */}
          {!loading && !error && (
            (items && items.length === 0) ?
              <div className='flex flex-col items-center justify-center w-full p-4 gap-3'>
                <span className="text-secondary-text">No items found.</span>
                <NavLink href={`/items/create`} type="button">Add New Raw Material</NavLink>
              </div> :
              <Table
                columns={[
                  { key: 'name', header: 'Name', sortable: true, render: r => r.name },
                  { key: 'grade', header: 'Grade', render: r => r.grade || '\u2014' },
                  { key: 'UOM', header: 'Unit', render: r => r.UOM || '\u2014' },
                  { key: 'minimumStock', header: 'Minimum Stock', render: r => r.minimumStock ?? '\u2014' },
                  { key: 'description', header: 'Description', render: r => r.description || '\u2014' },
                  { key: 'status', header: 'Status', render: r => (<StatusActions item={r} />) || '\u2014' },
                  {
                    key: 'updated',
                    header: 'Updated',
                    render: (r) => (
                      <div className="flex items-end justify-center flex-col">
                        <div><span className='text-xs text-white-600 capitalize'>{r?.updatedBy?.fullName ?? '—'}</span></div>
                        {r?.updatedBy?.fullName && <div><span className='text-xs text-white-400'>{formatDateDMY(r?.updatedAt, true)}</span></div>}
                      </div>
                    ),
                    align: 'right',
                  },
                  {
                    key: 'created',
                    header: 'Created',
                    render: (r) => (
                      <div className="flex items-end justify-center flex-col">
                        <div><span className='text-xs text-white-600 capitalize'>{r?.createdBy?.fullName ?? '—'}</span></div>
                        {r?.createdBy?.fullName && <div><span className='text-xs text-white-400'>{formatDateDMY(r?.createdAt, true) ?? '—'}</span></div>}
                      </div>
                    ),
                    align: 'right',
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: r => (
                      <div className='flex gap-2 items-center justify-end'>
                        <EditButton onClick={() => onEdit(r)} itemName={r.name} />
                        <DeleteButton onClick={e => onDelete(r.name, r._id, e.currentTarget)} itemName={r.name} requiredPermissions='items:delete' />
                      </div>
                    ),
                    align: 'right',
                  },
                ]}
                data={filteredItems}
                rowKey={r => r._id}
                selectable="multiple"
                selectedKeys={sel}
                onSelectionChange={setSel}
                loading={loading}
                pageSize={10}
                className='shadow-md'
              />
          )}
        </div>
      </div>}
    </>
  );
}