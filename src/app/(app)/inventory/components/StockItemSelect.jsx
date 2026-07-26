'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import Loading from '@/Components/Loading';

const EMPTY_PARAMS = Object.freeze({});

function snapshotLabel(it) {
  // console.log("it", it);
  it = it?.itemId || it
  let label = `<p>${it.name || it.itemName || it.sku || 'Unnamed Item'}</p>`;
  if (it?.temperature || it?.dimension || it?.density || it?.grade) label += '<div class="flex gap-2">';
  it?.temperature && (label += `<span class="text-xs ${it.temperature?.value > 1400 ? 'text-red-400' : 'text-blue-400'}">${it?.temperature ? it.temperature?.value + it.temperature?.unit : ''}</span>`);
  it?.dimension && (label += `<span class="text-xs text-white-500">${it?.dimension ? it.dimension?.length + ' × ' + it.dimension?.width + ' × ' + it.dimension?.thickness + ' × ' + it.dimension?.unit : ''}</span>`);
  it?.density && (label += `<span class="text-xs text-white-500">${it?.density ? it.density?.value + it.density?.unit : ''}</span>`);
  it?.grade && (label += `<span class="text-xs text-white-500">${it?.grade ? it.grade : ''}</span>`);
  if (it?.temperature || it?.dimension || it?.density || it?.grade) label += '</div>'
  if (it?.packing) label += `<div class="flex gap-1"><span class="text-xs text-white-500 capitalize">${it?.packing ? it.packing?.name : ''}</span>`
  if (it?.packing?.brandType) label += `<span class="text-xs text-white-500">${it?.packing?.brandType ? it.packing?.brandType : ''}</span>`
  // if(it?.packing?.productColor) label += `<span class='text-xs ${it.packing?.productColor == 'red' ? 'text-red-400' : 'text-blue-400'}'>${it?.packing?.productColor ? it.packing?.productColor : ''}</span>`
  if (it?.packing) label += '</div>'
  return label
}

/**
 * Selects one exact stock bucket, not merely an Item. The callback receives
 * (itemId, populatedItem, snapshot), allowing forms to lock warehouse/UOM/lot.
 */
function StockItemSelect({
  name = 'stockBucket',
  value,
  onChange,
  label = '',
  placeholder = 'Select available stock',
  required = false,
  disabled = false,
  apiparams = EMPTY_PARAMS,
  onFocus,
  readOnly = false,
  positiveOnly = true,
  reservedOnly = false,
  activeItemsOnly = true,
}) {
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const paramsKey = useMemo(() => JSON.stringify(apiparams || {}), [apiparams]);

  useEffect(() => {
    let ignore = false;
    const fetchSnapshots = async () => {
      setLoading(true);
      try {
        const suppliedParams = JSON.parse(paramsKey);
        const params = {
          ...suppliedParams,
          limit: 500,
          itemStatus: suppliedParams.itemStatus || (activeItemsOnly ? 'active' : undefined),
          positiveOnly: positiveOnly ? 'true' : undefined,
          reservedOnly: reservedOnly ? 'true' : undefined,
        };
        const response = await axiosInstance.get('/api/inventory/stock', { params });
        if (!ignore) {
          setSnapshots(
            Array.isArray(response?.data?.data) ? response.data.data : []
          );
        }
      } catch (error) {
        if (!ignore) {
          setSnapshots([]);
          Toast.error(error?.response?.data?.message || 'Failed to load stock');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchSnapshots();
    return () => { ignore = true; };
  }, [paramsKey, positiveOnly, reservedOnly, activeItemsOnly]);

  const options = useMemo(
    () => snapshots.map(snapshot => ({
      value: String(snapshot._id),
      label: snapshotLabel(snapshot),
    })),
    [snapshots],
  );

  const handleChange = bucketId => {
    if (!bucketId) return onChange?.(null, null, null);
    const snapshot = snapshots.find(row => String(row._id) === String(bucketId));
    if (!snapshot) return onChange?.(null, null, null);
    const item = snapshot.itemId || null;
    return onChange?.(item?._id || item, item, snapshot);
  };

  if (loading) {
    return (
      <div className="min-w-[240px]">
        {label && <div className="mb-1 text-sm">{label}</div>}
        <Loading variant="skeleton" className="h-9" />
      </div>
    );
  }

  return (
    <div className="min-w-[240px]">
      <SelectTypeInput
        id={name}
        name={name}
        required={required}
        label={label}
        value={value || ''}
        onChange={event => handleChange(event.target.value)}
        options={options}
        placeholder={options.length ? placeholder : 'No matching stock available'}
        disabled={disabled || options.length === 0}
        dropdownHeight="max-h-60"
        onFocus={onFocus}
        readOnly={readOnly}
      />
    </div>
  );
}

export default memo(StockItemSelect);
