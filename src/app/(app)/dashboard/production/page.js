'use client';
import { Toast } from '@/Components/toast';
import React, { useEffect, useMemo, useState } from 'react'
import { useDateRange } from '../layout';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import StockTable from '../../inventory/components/StockTable';

export default function Production() {
  const { dateRange } = useDateRange();
  const [loading, setLoading] = useState(false);
  const [productions, setProductions] = useState([]);
  const apiparams = {};
  const mergedParams = useMemo(() => {
    if (Array.isArray(apiparams)) {
      // Merge array of param objects left-to-right
      return Object.assign({}, ...apiparams);
    }
    return apiparams || {};
  }, [apiparams]);

  useEffect(() => {
    console.log('productions', productions);
  }, [productions]);

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // console.log('dateRange', dateRange);
        const startDate = dateRange?.start || '';
        const endDate = dateRange?.end || '';
        // status from prop unless caller already passed it in mergedParams
        if (startDate && endDate) params.set('startDate', startDate);
        if (startDate && endDate) params.set('endDate', endDate);

        // add all keys from mergedParams, skipping empty/undefined/null
        Object.entries(mergedParams).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '') return;
          params.set(key, String(val));
        });

        const qs = params.toString();
        console.log('qs', qs);
        const url = `/api/production${qs ? `?${qs}` : ''}`;
        const res = await axiosInstance.get(url);
        if (ignore) return;
        console.log('res', res);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setProductions(list);
      } catch (err) {
        // if (!ignore) Toast.error('Failed to load productions');
        console.error("error in fetching production", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if(dateRange?.start && dateRange?.end) fetchItems();
    return () => { ignore = true; };
  }, [dateRange]);

  // const filteredRows = useMemo(() => {
  //   if (!q && !pt) return rows;
  //   const needle = String(q).toLowerCase().trim();
  //   const str = (v) => (v == null ? '' : String(v)).toLowerCase();

  //   return rows.filter((r) => {
  //     const item = r.itemId || {};
  //     console.log("item", item)
  //     const productTypeStr = r?.productType ? `${r.productType}` : '';
  //     const tempStr = item?.temperature
  //       ? `${item.temperature?.value ?? ''} ${item.temperature?.unit ?? ''}`
  //       : '';
  //     const denStr = item?.density
  //       ? `${item.density?.value ?? ''} ${item.density?.unit ?? ''}`
  //       : '';
  //     const dimStr = item?.dimension ? mapDimension(item.dimension) : '';
  //     const pack = item?.packing || {};
  //     const packStr = [
  //       pack?.name,
  //       pack?.brandType,
  //       pack?.productColor,
  //       pack?.UOM || pack?.unit,
  //     ]
  //       .filter(Boolean)
  //       .join(' ');
  //     const nameStr = item?.name || ''; // if we want to filter by name as well latter we can use this
  //     const gradeStr = item?.grade || '';

  //     const haystack = [tempStr, denStr, dimStr, packStr, gradeStr]
  //       .map(str)
  //       .join(' | ');

  //     if (needle && pt) return needle.split(' ').every((w) => haystack.includes(w)) && productTypeStr.includes(pt);
  //     if (pt) return productTypeStr.includes(pt);
  //     if (needle) return needle.split(' ').every((w) => haystack.includes(w));
  //     return true;
  //   });
  // }, [rows, q, pt]);

  // const columns = useMemo(
  //   () => [
  //     {
  //       key: 'item',
  //       header: 'Item',
  //       sortable: true,
  //       render: (r) => r.itemId?.name || r.itemId || '—',
  //     },
  //     {
  //       key: 'temperature',
  //       header: 'Temperature',
  //       sortable: true,
  //       render: (r) =>
  //         r.itemId?.temperature ? (
  //           <span className={`${r.itemId?.temperature?.value > 1400 ? 'text-red-400' : 'text-blue-400'}`}>
  //             {r.itemId?.temperature?.value + ' ' + r.itemId?.temperature?.unit}
  //           </span>
  //         ) : (
  //           '—'
  //         ),
  //     },
  //     {
  //       key: 'density',
  //       header: 'Density',
  //       sortable: true,
  //       render: (r) =>
  //         r.itemId?.density ? r.itemId?.density?.value + ' ' + r.itemId?.density?.unit : '—',
  //     },
  //     {
  //       key: 'dimension',
  //       header: 'Dimension',
  //       sortable: true,
  //       render: (r) => (r.itemId?.dimension ? mapDimension(r.itemId?.dimension) : '—'),
  //     },
  //     {
  //       key: 'grade',
  //       header: 'Grade',
  //       sortable: true,
  //       render: (r) => (r.itemId?.grade ? (r.itemId?.grade) : '—'),
  //     },
  //     {
  //       key: 'packing',
  //       header: 'Packing',
  //       sortable: true,
  //       render: (r) => (r.itemId?.packing ? mapPacking(r.itemId?.packing) : '—'),
  //     },
  //     {
  //       key: 'warehouse',
  //       header: 'Warehouse',
  //       className: 'hidden lg:table-cell',
  //       sortable: true,
  //       render: (r) => r.warehouseId?.name || r.warehouseId || '—',
  //       group: 'other',
  //       groupLabel: 'Other Info',
  //       groupCollapsed: true,
  //     },/* for mobile version i want to hide this column from tabel so it's look good on mobile */
  //     {
  //       key: 'batchNo',
  //       header: 'Batch',
  //       className: 'hidden lg:table-cell',
  //       render: (r) => r.batchNo || '—',
  //       align: 'center',
  //       group: 'other',
  //       groupLabel: 'Other Info',
  //       groupCollapsed: true,
  //     },
  //     {
  //       key: 'bin',
  //       header: 'Bin',
  //       className: 'hidden lg:table-cell',
  //       render: (r) => r.bin || '—',
  //       align: 'center',
  //       group: 'other',
  //       groupLabel: 'Other Info',
  //       groupCollapsed: true,
  //     },
  //     {
  //       key: 'onHand',
  //       header: 'On Hand',
  //       sortable: true,
  //       align: 'right',
  //       className: 'hidden lg:table-cell',
  //       render: (r) => r.onHand ?? 0,
  //     },
  //     {
  //       key: 'reserved',
  //       header: 'Reserved',
  //       sortable: true,
  //       align: 'right',
  //       className: 'hidden lg:table-cell',
  //       render: (r) => r.reserved ?? 0,
  //     },
  //     {
  //       key: 'available',
  //       header: 'Available',
  //       sortable: true,
  //       align: 'right',
  //       render: (r) => r.available ?? (r.onHand ?? 0) - (r.reserved ?? 0),
  //     },
  //     {
  //       key: 'uom',
  //       header: 'UOM',
  //       render: (r) => r.uom || '—',
  //       align: 'center',
  //     },
  //   ],
  //   []
  // );

  return (
    <div className='h-full w-full'>
      {loading ? <Loading variant='skeleton' className='h-full w-full' />
        :
        <div className='h-full w-full'>productions data is here
          {
            productions.map((production) => (
              <div key={production?.matchedItem?._id}>

                <p>{production?.productType?.name}</p>

                <p>
                  {production?.temperature?.value} {production?.temperature?.unit}
                </p>

                <p>
                  {production?.density?.value} {production?.density?.unit}
                </p>

                <p>
                  {production?.dimension?.length} x
                  {production?.dimension?.width} x
                  {production?.dimension?.thickness}
                  {production?.dimension?.unit}
                </p>

                <p>{production?.packingItem?.name}</p>

                <p>Total rolls: {production?.totalRolls}</p>

                <p>Total Weight: {production?.totalWeight} kg</p>

              </div>
            ))
          }
          <StockTable
            rows={productions}
            loading={loading}
            // error={error}
            // filters={filters} // used for client-side query + productType filtering
            // refrence={refresh}
          />
        </div>
      }
    </div>
  )
}
