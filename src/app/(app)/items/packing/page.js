// src/app/items/packing/page.js 
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import DisplayMain from '@/Components/layout/DisplayMain';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from "@/Components/toast";
import EditButton from '@/Components/buttons/EditButton';
import DeleteButton from '@/Components/buttons/DeleteButton';
import { useRouter } from 'next/navigation';
import Table from '@/Components/layout/Table';
import StatusActions from '../components/StatusActions';
import NavLink from '@/Components/NavLink';
import Loading from '@/Components/Loading';
import { mapDimension } from '@/utils/FGP';
import { searchIcon } from '@/utils/SVG';
import { formatDateDMY } from '@/utils/date';

export default function Packing() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState([]);
  const router = useRouter();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/items/packings');
      setItems(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch packing items', error);
      setError(error.message || 'Failed to fetch packing items');
      Toast.error('Failed to fetch packing items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const packing = item.packing?.toLowerCase() || '';
      const density = item.density?.toString().toLowerCase() || '';
      const temperature = item.temperature?.toString().toLowerCase() || '';
      const dimensionStr = (() => {
        if (!item.dimension) return '';
        const { length, width, thickness, unit } = item.dimension;
        const parts = [];
        if (length != null) parts.push(length);
        if (width != null) parts.push(width);
        if (thickness != null) parts.push(thickness);
        return (parts.join(' × ') + ' ' + (unit || '')).toLowerCase();
      })();
      const productTypeName = item.productType?.name?.toLowerCase() || '';
      return (
        name.includes(lowerSearch) ||
        packing.includes(lowerSearch) ||
        density.includes(lowerSearch) ||
        temperature.includes(lowerSearch) ||
        dimensionStr.includes(lowerSearch) ||
        productTypeName.includes(lowerSearch)
      );
    });
  }, [items, search]);

  // Placeholder handlers for Edit and Delete actions
  const onEdit = (item) => {
    // Implement edit logic here (e.g., open modal, navigate, etc.)
    router.push(`/items/edit/${item._id}`);
  };
  const onDelete = async (name, id, triggerEl) => {
    // console.log('delete', name, id);
    try {
      const ok = await Toast.promise(`Delete ${name} packing? This will permanently delete the item. Are you sure?`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        focusTarget: triggerEl,
      });
      if (!ok) return;

      // optimistic UI: remove from list first
      setItems(prev => prev.filter(p => p._id !== id));
      await axiosInstance.delete(`/api/items/${id}`, { withCredentials: true });
      Toast.success('Item deleted');
    } catch (err) {
      console.error('delete failed', err);
      // restore removed item on error by refetching (simple approach)
      Toast.error('Failed to delete item');
      // quick refetch to ensure state is consistent
      try {
        await fetchItems();
      } catch (e) {
        // ignore secondary failure
      }
    }
  };
  console.log("items", items);
  return (
    <div className="Items-page h-full flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-h2 font-semibold mb-5">Packing Material</h1>
        <div className="flex gap-2 items-center">
          {loading && <Loading variant='skeleton' className='h-9 min-w-[500px] mb-5' />}
          {(items && items.length > 0 && !loading) && <>
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
              placeholder="Search by name size"
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
      {!loading && !error && (
        (items && items.length === 0) ?
          <div className='flex flex-col items-center justify-center w-full p-4 gap-3'>
            <span className="text-secondary-text">No items found.</span>
            <NavLink href={`/items/create`} type="button">Add New Packing Material</NavLink>
          </div> :
          <Table
            columns={[
              { key: 'name', header: 'Name', sortable: true, render: r => r.name },
              { key: 'brandType', header: 'Brand Type',sortable: true, render: r => r.brandType || '\u2014' },
              {
                key: 'productColor', header: 'Color',sortable: true, render: r => r?.productColor ? (
                  <div className={`${r.productColor.includes('red') ? 'dark:text-red-400 text-red-600 ' : 'dark:text-blue-400 text-blue-600'}`}>{r.productColor}</div>
                ) : '\u2014'
              },
              { key: 'UOM', header: 'Unit', render: r => r.UOM || '\u2014' },
              { key: 'minimumStock', header: 'Minimum Stock', render: r => r.minimumStock ?? '\u2014' },
              { key: 'dimension', header: 'Dimension', render: r => mapDimension(r?.dimension) || '\u2014' },
              { key: 'productType', header: 'Use for', render: r => <span className='capitalize text-white-600'>{r?.productType?.name}</span> ?? '\u2014' },
              {
                key: 'grade',
                header: 'Grade',
                render: (r) => (
                  r?.grade ? (r.grade) : '—'
                ),
              },
              { key: 'description', header: 'Description', render: r => r.description || '\u2014' },
              { key: 'status', header: 'Status', render: r => (<StatusActions item={r} />) || '\u2014' },
              {
                key: 'updated',
                header: 'Updated',
                render: (r) => (
                  <div className="flex items-end justify-center flex-col">
                    <div><span className='text-[0.9em] text-white-600 capitalize'>{r?.updatedBy?.fullName ?? '—'}</span></div>
                    {r?.updatedBy?.fullName && <div><span className='text-[0.85em] text-white-500'>{formatDateDMY(r?.updatedAt, true) ?? '—'}</span></div>}
                  </div>
                ),
                align: 'right',
                group: 'audit',
                groupLabel: 'Audit fields',
                groupCollapsed: true,   // hidden by default
              },
              {
                key: 'created',
                header: 'Created',
                render: (r) => (
                  <div className="flex items-end justify-center flex-col text-sm">
                    <div><span className='text-[0.9em] text-white-600 capitalize'>
                      {r?.createdBy?.fullName ?? '—'}
                    </span></div>
                    {r?.createdBy?.fullName &&
                      <div><span className='text-[0.85em] text-white-500'>
                        {formatDateDMY(r?.createdAt, true)}
                      </span></div>}
                  </div>
                ),
                align: 'right',
                group: 'audit',
                groupLabel: 'Audit fields',
                groupCollapsed: true,   // hidden by default
              },
              {
                key: 'actions',
                header: 'Actions',
                render: r => (
                  <div className='flex gap-2 items-center justify-end'>
                    <EditButton onClick={() => onEdit(r)} itemName={r.name} requiredPermissions='items:update' />
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
  );
}

/*
packings {
  _id: new ObjectId('68d4d74d347b19d635da110e'),
  name: 'woven bag',
  sku: 'ITEM-WOV-001',
  category: new ObjectId('68cfe5a6c52171ccf85b645e'),
  categoryKey: 'PACKING',
  UOM: 'pcs',
  currentStock: null,
  minimumStock: null,
  purchasePrice: 0,
  salePrice: 0,
  description: '',
  productType: { _id: new ObjectId('68cfe6eec52171ccf85b647c'), name: 'bulk' },
  dimension: new ObjectId('68d4d370da237f687a1804f0'),
  isArchived: false,
  brandType: 'branded',
  productColor: 'blue',
  createdAt: 2025-09-25T05:46:53.338Z,
  updatedAt: 2025-09-25T05:46:53.338Z,
  __v: 0
}
*/