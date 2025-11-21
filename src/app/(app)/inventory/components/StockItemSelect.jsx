'use client';

import { useEffect, useMemo, useState, memo } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import SelectInput from '@/Components/inputs/SelectInput';
import { Toast } from '@/Components/toast';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import Loading from '@/Components/Loading';

/**
 * ItemSelect
 *
 * A reusable dropdown for selecting items.
 * Props:
 * - value: selected itemId
 * - onChange: callback(itemId)
 * - label?: string
 * - placeholder?: string
 * - required?: boolean
 * - disabled?: boolean
 * - status?: string ('active' | 'draft' | 'archived')
 */
function StockItemSelect({
  name = 'item',
  value,
  onChange,
  label = '',
  placeholder = 'Select item',
  required = false,
  disabled = false,
  status = 'active',
  apiparams = {},
  onFocus,
  readOnly = false,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const mergedParams = useMemo(() => {
    if (Array.isArray(apiparams)) {
      // Merge array of param objects left-to-right
      return Object.assign({}, ...apiparams);
    }
    return apiparams || {};
  }, [apiparams]);

  useEffect(() => {
    let ignore = false;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // status from prop unless caller already passed it in mergedParams
        if (status && mergedParams.status == null) params.set('status', status);

        // add all keys from mergedParams, skipping empty/undefined/null
        Object.entries(mergedParams).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '') return;
          params.set(key, String(val));
        });

        const qs = params.toString();
        const url = `/api/inventory/stock${qs ? `?${qs}` : ''}`;
        const res = await axiosInstance.get(url);
        if (ignore) return;

        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.items)
            ? res.data.items
            : Array.isArray(res?.data)
              ? res.data
              : [];

        setItems(list);
      } catch (err) {
        if (!ignore) Toast.error('Failed to load items');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchItems();
    return () => {
      ignore = true;
    };
  }, [mergedParams, status]);

  // const options = useMemo(() => {
  //   return (items || []).map((it) => ({
  //     value: it?.itemId._id || it?.itemId.id,
  //     label: formateLabel(it),
  //   }));
  // }, [items]);

  const options = useMemo(() => {
    setLoading(true);
    const shorted = (items || []).map((it) => ({
      value: it?.itemId._id || it?.itemId.id,
      label: formateLabel(it),
    }));
    setLoading(false);
    return shorted;
  }, [items]);

  // `
  //       <p>${it.name || it.itemName || it.sku || 'Unnamed Item'}</p>        
  //       ${it?.temperature && `<span class="text-xs text-white-500">${it?.temperature ? it.temperature?.value + it.temperature?.unit  : ''}</span>`}
  //       ${it?.dimension && `<span class="text-xs text-white-500">${it?.dimension ? it.dimension?.length + 'x' + it.dimension?.width + 'x' + it.dimension?.thickness + 'x' + it.dimension?.unit  : ''}</span>`}
  //       ${it?.density && `<span class="text-xs text-white-500">${it?.density ? it.density?.value + it.density?.unit  : ''}</span>`}
  //     `
  function formateLabel(it) {
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

  const handleChange = (id) => {
    // id is a string from the native/select input
    // console.log('id', id);
    if (!id) return onChange?.(null, null);
    const it = items.find(x => String(x.itemId._id) === String(id));
    console.log('it', it, id, items);
    return onChange?.(id, (it?.itemId || it) || null);
  };
  // console.log('options', options);
  return (
    <div className="flex flex-col gap-1 min-w-[240px]">
      {loading && <Loading variant="skeleton" className="h-9" />}
      {!loading && <SelectTypeInput
        id={name}
        name={name}
        required={required}
        label={label || ''}
        value={value || ''}
        onChange={e => handleChange(e.target.value)}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        dropdownHeight={"max-h-60"}
        onFocus={onFocus}
        readOnly={readOnly}
        inputLoading={loading}
      />}
    </div>
  );
}

export default memo(StockItemSelect);