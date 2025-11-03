// src/app/manufacturing/batches/page.js
'use client';
import Manufacturing from '../page';
import { useCallback, useState, useEffect, useMemo, memo, useRef } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { useActiveCampaign } from '../ActiveCampaignProvider';
import { useNavList } from '../NavListContext';
import { useRouter } from 'next/navigation';


// Stable helper: today's date as YYYY-MM-DD
const todayStr = () => new Date().toISOString().slice(0, 10);

// Ensure array shape matches target length (pads with factory() and trims extra)
function ensureArrayLen(arr, len, factory = () => ({})) {
    const out = Array.isArray(arr) ? [...arr] : [];
    while (out.length < len) out.push(factory());
    if (out.length > len) out.length = len;
    return out;
}

// Fields used in per-row error maintenance
const REQUIRED_FIELDS = ['name', 'weight'];

const RowEditor = memo(function RowEditor({
    idx,
    row,
    rowErr = {},
    rowTouched = {},
    onNameChange,
    onNameBlur,
    onWeightChange,
    onWeightBlur,
    onAdd,
    onRemove,
    canRemove,
    userSelectedValue,
}) {
    return (

        <div className="flex items-start gap-4">
            <SelectTypeInput
                placeholder="Raw material name"
                label="Raw material name"
                name={`name_${idx}`}
                value={row?.name?.value ?? ''}
                onChange={() => { /* no-op: do not commit free text */ }}
                onBlur={() => {
                    onNameBlur(idx);
                }}
                required
                apiget="/api/raw"
                allowCustomValue={false}
                err={rowTouched.name ? rowErr.name : ''}
                onSelectOption={(opt) => {
                    onNameChange(idx, opt);
                }}
                userSelectedValue={userSelectedValue}
            />
            <CustomInput
                type="number"
                placeholder="Weight in this batch (kg)"
                label="Weight (kg)"
                name={`weight_${idx}`}
                value={row?.weight ?? ''}
                onChange={(e) => onWeightChange(idx, e)}
                onBlur={() => onWeightBlur(idx)}
                required
                err={rowTouched.weight ? rowErr.weight : ''}
            />
            <div className="flex gap-2 pt-6">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onAdd}
                    className='py-1.5 px-2 border border-color-100 rounded-lg shadow-md'
                    aria-label="Add row"
                >
                    +
                </button>
                {canRemove && (
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onRemove(idx)}
                        className='py-1.5 px-2 border border-color-100 rounded-lg shadow-md'
                        aria-label="Remove row"
                    >
                        –
                    </button>
                )}
            </div>
        </div>
    );
});

// --- Helper functions for row validation ---
function nameToString(v) {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return v.label ?? v.value ?? '';
    return '';
}

function validateRow(row) {
    const err = {};
    const nameStr = nameToString(row?.name).trim();
    if (!nameStr) err.name = 'Raw material is required';

    const w = row?.weight;
    if (w === '' || w === null || w === undefined) err.weight = 'Weight is required';
    else if (Number.isNaN(Number(w))) err.weight = 'Weight must be a number';
    else if (Number(w) <= 0) err.weight = 'Weight must be greater than 0';

    return err;
}

export default function RawMaterials() {

    
    const router = useRouter();

    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formResetToken, setFormResetToken] = useState(0);
    const { activeCampaign } = useActiveCampaign();
    // Row-scoped clear signal: { idx: number, token: any } | null
    const [rejectSignal, setRejectSignal] = useState(null);
    const [formData, setFormData] = useState({
        numbersBatches: '',
        batchesID: '',
        date: todayStr(), // default to today as YYYY-MM-DD string
        items: [
            { name: '', weight: '' }
        ],
        campaign: '',
    });

    const itemsRef = useRef(formData.items);

    useEffect(() => {
        itemsRef.current = formData.items;
    }, [formData.items]);

    // Sync campaign name from context when available (handles refresh / late hydration)
    useEffect(() => {
        if (activeCampaign && activeCampaign.name) {
            setFormData(prev => {
                if (prev.campaign === activeCampaign.name) return prev;
                return { ...prev, campaign: activeCampaign.name };
            });
        }
    }, [activeCampaign?._id, activeCampaign?.name]);


    // Helpers to keep error arrays sized to current rows
    const ensureErrLen = useCallback((arr) => (
      ensureArrayLen(arr, (itemsRef.current?.length ?? 0), () => ({}))
    ), []);
    // put this inside the component, replacing the current validate
    const validate = useCallback((data) => {
        const e = {};
        const items = Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {
            e.items = [{ name: 'Raw material is required', weight: 'Weight is required' }];
        } else {
            e.items = items.map(validateRow);
        }

        if (data.numbersBatches != null && data.numbersBatches !== '') {
            const num = Number(data.numbersBatches);
            if (Number.isNaN(num)) e.numbersBatches = 'Must be a number';
            else if (num <= 0) e.numbersBatches = 'Must be greater than 0';
        }


        if (!data.date) {
            e.date = 'Date is required';
        } else {
            const d = new Date(data.date);
            if (Number.isNaN(d.getTime())) {
                e.date = 'Invalid date';
            }
        }

        if (e.items && e.items.every(r => Object.keys(r).length === 0)) {
            delete e.items;
        }
        if (e.numbersBatches === undefined) delete e.numbersBatches;
        return e;
    }, []);

    const handleChange = useCallback((eOrName, maybeValue) => {
        let name, value;
        if (eOrName && eOrName.target) {
            // Standard event from <input> or <select>
            name = eOrName.target.name;
            value = eOrName.target.value;
        } else {
            // Direct call: handleChange(name, value)
            name = eOrName;
            value = maybeValue;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    // Update errors for a specific row, removing cleared field errors
    const updateRowErrors = useCallback((index, row) => {
        const rowErr = validateRow(row); // contains only fields that currently have errors
        setErrors(prevErr => {
            const errItems = Array.isArray(prevErr.items) ? [...prevErr.items] : [];
            const prevRowErr = { ...(errItems[index] || {}) };

            // For each field we care about, set error if present; otherwise remove it
            const nextRowErr = { ...prevRowErr };
            for (const f of REQUIRED_FIELDS) {
                if (rowErr[f]) nextRowErr[f] = rowErr[f];
                else delete nextRowErr[f];
            }

            errItems[index] = nextRowErr;
            return { ...prevErr, items: errItems };
        });
    }, []);

    const handleItemChange = useCallback((index, field, eOrValue) => {
        let value = (eOrValue && eOrValue.target) ? eOrValue.target.value : eOrValue;

        if (value === undefined || value === null) value = '';
        if (typeof value === 'object' && field !== 'name') value = '';

        if (field === 'weight') {
            value = String(value);
        }

        setFormData(prev => {
            const items = Array.isArray(prev.items) ? [...prev.items] : [];
            const current = items[index] || { name: '', weight: '' };
            const nextRow = { ...current, [field]: value };
            items[index] = nextRow;

            // validate this row from the same snapshot
            updateRowErrors(index, nextRow);

            if (formError) setFormError('');
            return { ...prev, items };
        });
    }, [formError, updateRowErrors]);

    const handleItemBlur = useCallback((index, field) => {
        const rowCount = itemsRef.current?.length ?? 0;
        // Blur only marks the cell as touched (validation happens on change)
        setTouched(prev => {
            const items = ensureArrayLen(prev.items, rowCount, () => ({ name: false, weight: false }));
            items[index] = { ...(items[index] || {}), [field]: true };
            return { ...prev, items };
        });
    }, []);

    // helper to normalize option -> {label, value} or null
    const normalizeOption = (v) => {
        if (v && typeof v === 'object') {
            const label = String(v.label ?? '');
            const value = String(v.value ?? v.id ?? '');
            return value ? { label, value } : null;
        }
        if (typeof v === 'string' && v.trim()) {
            return { label: '', value: v.trim() }; // if backend ever returns raw id strings
        }
        return null;
    };

    // Find first duplicate row (by Raw Material id) excluding index `idx`; returns the conflicting row or null
    const findDuplicateById = useCallback((idx, newId) => {
      if (!newId) return null;
      const items = itemsRef.current || [];
      for (let j = 0; j < items.length; j++) {
        if (j === idx) continue;
        const other = items[j];
        const otherId = (typeof other?.name === 'object') ? other.name?.value : (typeof other?.name === 'string' ? other.name : '');
        if (otherId && otherId === newId) return other;
      }
      return null;
    }, []);

    // Perform the standard duplicate rejection flow for row `i` with a human message
    const rejectDuplicate = useCallback((i, dupText) => {
      // 1) tell the select to clear
      setRejectSignal({ idx: i, token: Date.now() });
      // 2) clear committed state for this row
      setFormData(prev => {
        const nextItems = Array.isArray(prev.items) ? [...prev.items] : [];
        const cur = nextItems[i] || { name: '', weight: '' };
        nextItems[i] = { ...cur, name: '' };
        return { ...prev, items: nextItems };
      });
      // 3) set name error
      setErrors(prev => {
        const nextItems = ensureErrLen(prev.items);
        const rowErr = { ...(nextItems[i] || {}) };
        rowErr.name = `${dupText} is already added`;
        nextItems[i] = rowErr;
        return { ...prev, items: nextItems };
      });
      // 4) mark touched
      setTouched(prev => {
        const nextItems = Array.isArray(prev.items) ? [...prev.items] : [];
        const rowTouched = { ...(nextItems[i] || {}) };
        rowTouched.name = true;
        nextItems[i] = rowTouched;
        return { ...prev, items: nextItems };
      });
    }, [ensureErrLen]);

    const onNameChange = useCallback((i, v) => {
        const opt = normalizeOption(v);
        if (!opt) {
            // empty / invalid → just validate required on blur later
            return;
        }

        const itemsSnap = Array.isArray(itemsRef.current) ? itemsRef.current : [];
        const match = findDuplicateById(i, opt.value);
        if (match) {
            const dupText = (nameToString(match?.name) || opt.label || String(opt.value)).trim();
            rejectDuplicate(i, dupText);
            return;
        }

        // Clear any previous name error (regardless of message text)
        setErrors(prev => {
            const nextItems = ensureErrLen(prev.items);
            if (nextItems[i] && Object.prototype.hasOwnProperty.call(nextItems[i], 'name')) {
                const rowErr = { ...(nextItems[i] || {}) };
                delete rowErr.name;
                nextItems[i] = rowErr;
                return { ...prev, items: nextItems };
            }
            return prev;
        });

        // Commit valid selection
        handleItemChange(i, 'name', opt);
    }, [handleItemChange, findDuplicateById, rejectDuplicate, ensureErrLen]);

    useEffect(() => {
        if (!rejectSignal) return;
        // When the target row's name is now empty, consider the clear consumed
        const { idx } = rejectSignal;
        const row = itemsRef.current?.[idx];
        const nameStr = nameToString(row?.name).trim();
        if (!nameStr) {
            setRejectSignal(null);
        }
    }, [rejectSignal, formData.items]);

    const onNameBlur = useCallback((i) => {
        handleItemBlur(i, 'name');
    }, [handleItemBlur]);

    const onWeightBlur = useCallback((i) => {
        handleItemBlur(i, 'weight');
    }, [handleItemBlur]);

    const onWeightChange = useCallback((i, v) => {
        handleItemChange(i, 'weight', v);
    }, [handleItemChange]);

    const handleBlur = useCallback((field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => {
            const all = validate(formData);
            return { ...prev, [field]: all[field] };
        });
    }, [formData, validate]);

    const addRow = useCallback((e) => {
        e?.preventDefault?.();
        if (formError) setFormError('');

        const items = Array.isArray(formData.items) ? formData.items : [];
        let incomplete = false;

        for (let i = 0; i < items.length; i++) {
            const r = items[i] || {};
            const nameStr = typeof r.name === 'string' ? r.name : (r?.name?.label ?? r?.name?.value ?? '');
            const hasName = String(nameStr).trim().length > 0;

            const wNum = Number(r.weight);
            const hasWeight = r.weight !== '' && r.weight !== null && r.weight !== undefined
                && Number.isFinite(wNum) && wNum > 0;

            if (!hasName || !hasWeight) { incomplete = true; break; }
        }

        if (incomplete) {
            setFormError('Please fill Raw material and Weight for existing rows before adding another.');
            setTouched(prev => ({
                ...prev,
                items: items.map(() => ({ name: true, weight: true }))
            }));
            setErrors(prev => ({
                ...prev,
                items: ensureArrayLen(items.map(r => validateRow(r)), items.length, () => ({}))
            }));
            return;
        }

        // Safe to add a new row
        setFormData(prev => ({ ...prev, items: [...prev.items, { name: '', weight: '' }] }));
        setErrors(prev => ({
            ...prev,
            items: ensureArrayLen(prev.items, (formData.items?.length ?? 0) + 1, () => ({}))
        }));
        setTouched(prev => ({
            ...prev,
            items: ensureArrayLen(prev.items, (formData.items?.length ?? 0) + 1, () => ({ name: false, weight: false }))
        }));
    }, [formData]);

    const removeRow = useCallback((index) => {
        setFormData(prev => {
            const next = Array.isArray(prev.items) ? [...prev.items] : [];
            next.splice(index, 1);
            return { ...prev, items: next };
        });
        setErrors(prev => {
            const len = Math.max(0, (formData.items?.length ?? 0) - 1);
            return { ...prev, items: ensureArrayLen(prev.items, len, () => ({})) };
        });
        setTouched(prev => {
            const len = Math.max(0, (formData.items?.length ?? 0) - 1);
            return { ...prev, items: ensureArrayLen(prev.items, len, () => ({ name: false, weight: false })) };
        });
    }, [formData.items]);

    // --- Derived batchesID builder (memoized) ---
    const totalWeight = useMemo(() => {
        const items = Array.isArray(formData.items) ? formData.items : [];
        return items
            .map(r => Number(r.weight))
            .filter(n => Number.isFinite(n) && n > 0)
            .reduce((a, b) => a + b, 0);
    }, [formData.items]);

    const parts = useMemo(() => {
        const items = Array.isArray(formData.items) ? formData.items : [];
        if (items.length === 0) return [];
        return items
            .map(r => {
                const nameStr = nameToString(r.name);
                if (!nameStr) return '';
                const pct = totalWeight > 0 ? Math.round((Number(r.weight) / totalWeight) * 100) : 0;
                return `${nameStr.charAt(0).toUpperCase()}${pct}`;
            })
            .filter(Boolean);
    }, [formData.items, totalWeight]);

    const prefix = useMemo(() => {
        return `B${formData.numbersBatches ? String(formData.numbersBatches) : ''}`;
    }, [formData.numbersBatches]);

    const suffix = useMemo(() => {
        // Date/time suffix: ddmmyyyy/hhmm (24h)
        const dateObj = formData.date ? new Date(formData.date) : new Date();
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = String(dateObj.getFullYear());
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}${mm}${yyyy}/${hh}${min}`;
    }, [formData.date]);

    const computedBatchID = useMemo(() => {
        return [prefix, ...parts, suffix].filter(Boolean).join('-');
    }, [prefix, parts, suffix]);

    useEffect(() => {
        if (formData.batchesID !== computedBatchID) {
            setFormData(prev => ({ ...prev, batchesID: computedBatchID }));
        }
    }, [computedBatchID]);


    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        const all = validate(formData);
        if (Object.keys(all).length) {
            setErrors(all);
            setTouched({ ...touched, numbersBatches: true, items: formData.items.map(() => ({ name: true, weight: true })) });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                date: formData.date || undefined,
                numbersBatches: formData.numbersBatches ? Number(formData.numbersBatches) : undefined,
                batche_id: formData.batchesID || undefined,
                rawMaterials: formData.items.map((r) => {
                    const hasObj = r && typeof r.name === 'object';
                    const label = hasObj ? (r.name.label ?? '') : (typeof r?.name === 'string' ? r.name.trim() : '');
                    const value = hasObj ? (r.name.value ?? '') : '';
                    return {
                        rawMaterial_id: value || undefined,
                        // rawMaterialName: label || undefined,
                        weight: Number(r.weight)
                    };
                }),
                campaign: formData.campaign ? activeCampaign._id : formData.campaign , // TODO: Use active campaign
            };
            console.log('payload', payload);
            const res = await axiosInstance.post('/api/batches', payload);

            Toast.success(res?.data?.message || 'Raw material batch added');

            // Reset form
            setFormData({ numbersBatches: '', batchesID: '', date: todayStr(), items: [{ name: '', weight: '' }] });
            setTouched({});
            setErrors({});
            setFormError('');
            setRejectSignal(null);
            setFormResetToken((t) => t + 1);
            router.push('/manufacturing/batches/view');
        } catch (error) {
            console.error(error);
            Toast.error(error?.response?.data?.message || 'Failed to add raw material batch');
        } finally {
            setSaving(false);
        }
    }, [formData, Toast, touched]);


    return (
        <Manufacturing>
            <h1 className="text-xl font-semibold mb-4">Add Raw Materials Batch</h1>

            <form key={formResetToken} onSubmit={handleSubmit} className="bg-most-secondary shadow-md rounded-lg p-6 space-y-6">
                <div className="flex items-start gap-4">
                    <CustomInput
                        type="number"
                        placeholder="Number of batches"
                        label="Number of batches"
                        name="numbersBatches"
                        value={formData.numbersBatches}
                        onChange={handleChange}
                        onBlur={() => handleBlur('numbersBatches')}
                        err={touched.numbersBatches ? errors.numbersBatches : ''}
                        required
                    />
                    <CustomInput
                        type="text"
                        placeholder="Campaign Name"
                        label="Campaign Name"
                        name="campaign"
                        value={formData.campaign}
                        onChange={handleChange}
                        onBlur={() => handleBlur('campaign')}
                        err={touched.campaign ? errors.campaign : ''}
                        readOnly
                        className='capitalize'
                    />
                    <CustomInput
                        type="text"
                        placeholder="Batch ID"
                        label="Batch ID"
                        name="batchesID"
                        value={formData.batchesID}
                        onChange={handleChange}
                        onBlur={() => handleBlur('batchesID')}
                        err={touched.batchesID ? errors.batchesID : ''}
                        readOnly
                    />
                    <CustomInput
                        type="date"
                        name="date"
                        value={formData.date ?? ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('date')}
                        required
                        placeholder="date"
                        label="Date"
                        err={touched.date ? errors.date : ''}
                    />
                </div>
                {formData.items.map((row, idx) => (
                    <RowEditor
                        key={idx}
                        idx={idx}
                        row={row}
                        rowErr={(errors.items && errors.items[idx]) || {}}
                        rowTouched={(touched.items && touched.items[idx]) || {}}
                        onNameChange={onNameChange}
                        onNameBlur={onNameBlur}
                        onWeightChange={onWeightChange}
                        onWeightBlur={onWeightBlur}
                        onAdd={addRow}
                        onRemove={removeRow}
                        canRemove={formData.items.length > 1}
                        userSelectedValue={rejectSignal?.idx === idx ? { action: 'clear', token: rejectSignal.token } : undefined}
                    />
                ))}

                <div className='flex items-center justify-start w-full gap-5'>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving…' : 'Save Batch'}
                    </button>
                    {formError && (
                        <p className=" text-sm text-error">{formError}</p>
                    )}
                </div>
            </form>
        </Manufacturing>
    );
}