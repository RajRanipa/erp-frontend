'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Loading from '@/Components/Loading';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';

const EMPTY_PARAMS = Object.freeze({});

const  itemLabel = (it) => {
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

function ItemSelect({
  name = 'item',
  value,
  onChange,
  label = '',
  placeholder = 'Select Item',
  required = false,
  disabled = false,
  status = 'active',
  apiparams = EMPTY_PARAMS,
  onFocus,
  readOnly = false,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const paramsKey = useMemo(() => {
    const supplied = Array.isArray(apiparams)
      ? Object.assign({}, ...apiparams)
      : apiparams || {};
    return JSON.stringify({
      ...supplied,
      status: supplied.status ?? status,
    });
  }, [apiparams, status]);

  useEffect(() => {
    let ignore = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = JSON.parse(paramsKey);
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] == null) delete params[key];
        });
        const response = await axiosInstance.get('/api/items/options', { params });
        if (!ignore) {
          setItems(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (error) {
        if (!ignore) {
          setItems([]);
          Toast.error(error?.response?.data?.message || 'Failed to load Items');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchItems();
    return () => { ignore = true; };
  }, [paramsKey]);

  const options = useMemo(
    () => items.map(item => ({
      value: String(item._id),
      label: itemLabel(item),
    })),
    [items],
  );

  const handleChange = itemId => {
    if (!itemId) return onChange?.(null, null);
    const item = items.find(row => String(row._id) === String(itemId));
    return onChange?.(itemId, item || null);
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
        placeholder={options.length ? placeholder : 'No matching active Items'}
        disabled={disabled || options.length === 0}
        dropdownHeight="max-h-60"
        onFocus={onFocus}
        readOnly={readOnly}
      />
    </div>
  );
}

export default memo(ItemSelect);
