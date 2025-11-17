// src/app/items/finished/page.js
'use client';
import React, { useEffect, useState, useMemo, useDeferredValue, memo } from 'react';
import { useRouter } from 'next/navigation';
import SelectInput from '@/Components/inputs/SelectInput';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import NavLink from '@/Components/NavLink';
import EditButton from '@/Components/buttons/EditButton';
import DeleteButton from '@/Components/buttons/DeleteButton';
import Table from '@/Components/layout/Table.jsx';
import StatusActions from '../components/StatusActions';
import Loading from '@/Components/Loading';
import { mapDimension, mapPacking, mapTemperature } from '@/utils/FGP';
import { searchIcon } from '@/utils/SVG';
import { formatDateDMY } from '@/utils/date';


// helper used inside Row too
function formatDimension(dim) {
  if (!dim) return '\u2014';
  const { length, width, thickness, unit } = dim;
  const parts = [];
  if (length != null) parts.push(length);
  if (width != null) parts.push(width);
  if (thickness != null) parts.push(thickness);
  const dims = parts.join(' \u00d7 ');
  return dims ? `${dims} ${unit || ''}`.trim() : '\u2014';
}

export default function Finished() {

  const router = useRouter();

  const [items, setItems] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [productTypeFilter, setProductTypeFilter] = useState('');

  const [sel, setSel] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const itemsRes = await axiosInstance.get('/api/items/finished');
        if (!mounted) return;

        const itemsData = itemsRes.data || [];
        console.log('itemsData', itemsData);
        // return;
        setItems(itemsData);

        // Extract unique product types from the items themselves
        const uniqueTypes = Array.from(
          new Map(
            itemsData
              .filter(it => it.productType?.name)
              .map(it => [it.productType._id, { value: it.productType._id, label: it.productType.name }])
          ).values()
        );
        setProductTypes(uniqueTypes);
        setError(null);
      } catch (err) {
        console.error('fetch error', err);
        setError(err?.message || 'Failed to load');
        Toast.error('Failed to fetch items', { duration: 4000 });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // client-side filtering and searching (memoized)
  const rows = useMemo(() => {
    const qLower = (dq || '').toString().trim().toLowerCase();
    return items.filter(it => {
      // productType filter (productType is populated on backend)
      if (productTypeFilter) {
        if (!it.productType || it.productType._id !== productTypeFilter) return false;
      }
      // search across name, packing.name, density.value, temperature.value, dimension, productType.name
      if (qLower) {
        const hay = [
          it.name,
          it.packing?.name,
          it.density?.value,
          it.temperature?.value,
          formatDimension(it.dimension),
          it.productType?.name
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(qLower);
      }
      return true;
    });
  }, [items, dq, productTypeFilter]);

  const onEdit = (item) => {
    // navigate to edit page (adjust route if your app expects different path)
    router.push(`/items/edit/${item._id}`);
  };

  const onDelete = async (name, id, triggerEl) => {
    console.log('delete', name, id);
    try {
      const ok = await Toast.promise(`Delete ${name} product? This will permanently delete the item. Are you sure?`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
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
        const resp = await axiosInstance.get('/api/items/finished');
        setItems(resp.data || []);
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <div>
      <div className="Items-page h-full flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-h2 font-semibold mb-5">Finished Goods</h1>
          <div className="flex gap-2 items-center relative w-fit">
            {loading ? <Loading variant='skeleton' className='h-9' /> : ((items && items.length > 0) && <>
              <SelectInput
                name="product_type"
                value={productTypeFilter}
                onChange={e => setProductTypeFilter(e.target.value)}
                options={[{ value: '', label: 'All types' }, ...productTypes]}
                className="w-fit"
                parent_className="w-fit"
              />
              <CustomInput
                name="search_items"
                placeholder="Search name / packing / unit / type"
                onChange={e => setQ(e.target.value)}
                value={q}
                parent_className="min-w-[280px] w-fit"
                icon={searchIcon()}
              />
            </>)}
          </div>
        </div>
        {/* <Loading variant='skeleton' className='h-full' /> */}
        {loading ? <Loading variant='skeleton' className='h-full' /> : error ? <div className="p-4 text-red-500">{error}</div> : (
          (items && items.length === 0) ?
            <div className='flex flex-col items-center justify-center w-full p-4 gap-3'>
              <span className="text-secondary-text">No items found.</span>
              <NavLink href={`/items/create`} type="button">Add new Finished Good</NavLink>
            </div> :
            <Table columns={[
              {
                key: 'name',
                header: 'Name',
                sortable: true,
                render: (r) => <div className="font-semibold">{r.name}</div>,
              },
              {
                key: 'temperature',
                header: 'Temperature',
                sortable: true,
                render: (r) => (mapTemperature(r?.temperature) ?? '—'),
                align: 'center',
              },
              {
                key: 'dimension',
                header: 'Dimension',
                render: (r) => (mapDimension(r?.dimension) ?? '—'),
                align: 'center',
              },
              {
                key: 'density',
                header: 'Density',
                render: (r) => (r?.density?.value ? `${r.density.value} ${r.density?.unit || ''}` : '—'),
                align: 'center',
              },
              {
                key: 'packing',
                header: 'Packing',
                render: (r) => (
                  <NavLink href={`/items/packing`} >
                  {mapPacking(r.packing)}
                  </NavLink>
                ),
              },
              {
                key: 'unit',
                header: 'Unit',
                render: (r) => r.UOM || '\u2014',
                align: 'center',
              },
              { key: 'status', header: 'Status', render: r => (<StatusActions item={r} />) || '\u2014' },
              {
                key: 'updated',
                header: 'Updated',
                render: (r) => (
                  <div className="flex items-start justify-center flex-col">
                    <div><span className='text-xs text-white-600 capitalize'>{r?.createdBy?.fullName ?? '—'}</span></div>
                    {r?.createdBy?.fullName && <div><span className='text-xs text-white-400'>{formatDateDMY(r?.createdAt)}</span></div>}
                  </div>
                ),
                align: 'right',
              },
              {
                key: 'created',
                header: 'Created',
                render: (r) => (
                  <div className="flex items-start justify-center flex-col">
                    <div><span className='text-xs text-white-600 capitalize'>{r?.updatedBy?.fullName ?? '—'}</span></div>
                    {r?.updatedBy?.fullName && <div><span className='text-xs text-white-400'>{formatDateDMY(r?.createdAt) ?? '—'}</span></div>}
                  </div>
                ),
                align: 'right',
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div className="flex items-center justify-end gap-2">
                    <EditButton onClick={() => onEdit(r)} itemName={r.name} requiredPermissions='items:update'  />
                    <DeleteButton onClick={(e) => onDelete(r.name, r._id, e.currentTarget)} itemName={r.name} requiredPermissions='items:delete' />
                  </div>
                ),
                align: 'left',
              },
            ]}
              data={rows}
              rowKey={(r) => r._id}
              selectable="multiple"
              selectedKeys={sel}
              onSelectionChange={setSel}
              virtualization={items.length > 100}
              loading={loading}
            />
        )}
      </div>
    </div>
  );
}

{/* <Table ths={['Name', 'Temperature', 'Dimension', 'Density', 'Packing', 'Unit', 'Actions']}>
            {rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-secondaryText" colSpan={7}>No items found.</td></tr>
            ) : (
              rows.map(item => (
                <Row key={item._id} item={item} onEdit={onEdit} onDelete={onDelete} />
              ))
            )}
          </Table> */}