// src/app/(app)/items/raw/page.js
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import CustomInput from '@/components/inputs/CustomInput';
import DisplayMain from '@/components/layout/DisplayMain';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast, useConfirmToast } from '@/components/toast';
import Items from '../page';
import EditButton from '@/components/buttons/EditButton';
import DeleteButton from '@/components/buttons/DeleteButton';
import { useRouter } from 'next/navigation';
import Table from '@/components/layout/Table';

export default function Raw() {
  const toast = useToast();
  const confirmToast = useConfirmToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axiosInstance.get('/api/items/raw');
        setItems(response.data || []);
        setLoading(false);
      } catch (err) {
        setError(err?.message || 'Failed to fetch items');
        setLoading(false);
        toast({ type: 'error', message: 'Failed to fetch raw items' });
      }
    };
    fetchItems();
  }, [toast]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter(it => {
      const name = it.name?.toLowerCase() || '';
      const grade = it.grade?.toLowerCase() || '';
      const unit = it.product_unit?.toLowerCase() || '';
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
      const ok = await confirmToast(`Delete ${name} ? This will permanently delete the item. Are you sure?`, {
        type: 'warning',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        placement: 'top-center',
        animation: 'top-bottom',
        focusTarget: triggerEl,
      });
      if (!ok) return;

      // optimistic UI
      setItems(prev => prev.filter(p => p._id !== id));
      await axiosInstance.delete(`/api/items/${id}`, { withCredentials: true });
      toast({ type: 'success', message: 'Item deleted' });
    } catch (err) {
      console.error('delete failed', err);
      toast({ type: 'error', message: 'Failed to delete item' });
      // simple refetch to restore
      try {
        const resp = await axiosInstance.get('/api/items/raw');
        setItems(resp.data || []);
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <>
      <Items>
        <div className="Items-page">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-h2 font-semibold mb-5">Raw Materials</h1>
            <div className="flex gap-2 items-center flex-[0_1_30%]">
              <CustomInput
                name="search_items"
                placeholder="Search name / grade / unit"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}

          {!loading && !error && (
            <Table
              columns={[
                { key: 'name', header: 'Name', sortable: true, render: r => r.name },
                { key: 'grade', header: 'Grade', render: r => r.grade || '\u2014' },
                { key: 'product_unit', header: 'Unit', render: r => r.product_unit || '\u2014' },
                { key: 'minimumStock', header: 'Minimum Stock', render: r => r.minimumStock ?? '\u2014' },
                { key: 'description', header: 'Description', render: r => r.description || '\u2014' },
                {
                  key: 'actions',
                  header: '',
                  render: r => (
                    <div className='flex gap-2 items-center'>
                      <EditButton onClick={() => onEdit(r)} itemName={r.name} />
                      <DeleteButton onClick={e => onDelete(r.name, r._id, e.currentTarget)} itemName={r.name} />
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
            />
          )}
        </div>
      </Items>
    </>
  );
}