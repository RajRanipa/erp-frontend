'use client';
// frontend-erp/src/app/(app)/inventory/components/PackingChangeForm.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import ItemSelect from './ItemSelect';
import WarehouseSelect from './WarehouseSelect';
import CustomInput from '@/Components/inputs/CustomInput';
import TextArea from '@/Components/inputs/TextArea';
import StockItemSelect from './StockItemSelect';

export default function PackingChangeForm({
    onSuccess,
    warehouses = [],
}) {
    const [form, setForm] = useState({
        fromItemId: '',
        toItemId: '',
        warehouseId: '',
        qty: '',
        uom: '',
        batchNo: '',
        bin: '',
        note: '',
    });
    const [loading, setLoading] = useState(false);
    const baseParams = useMemo(() => ({ categoryKey: 'FG' }), []);
    const [toItemParams, setToItemParams] = useState(baseParams);
    const [itemForm, setItemForm] = useState(false);
    const [fromMeta, setFromMeta] = useState(null);
    const [toMeta, setToMeta] = useState(null);
    const [error, setError] = useState(false);

    const sameItem = form.fromItemId && form.toItemId && form.fromItemId === form.toItemId;

    // // console.log('form.toItemId', form.toItemId);
    const qtyNumber = useMemo(() => {
        const n = Number(form.qty);
        return Number.isFinite(n) ? n : NaN;
    }, [form.qty]);

    const isQtyValid = Number.isFinite(qtyNumber) && qtyNumber > 0;

    useEffect(() => {
        if (form.qty) setError(!isQtyValid);
    }, [isQtyValid, form.qty, qtyNumber])

    const isValid = Boolean(
        form.fromItemId &&
        form.toItemId &&
        form.warehouseId &&
        form.uom?.trim() &&
        isQtyValid &&
        !sameItem
    );

    const handleChange = useCallback((patch, itemObj) => {
        // Only compute derived filters when FROM item changes
        const isFromChange = Object.prototype.hasOwnProperty.call(patch, 'fromItemId');

        if (isFromChange && itemObj) {
            const derived = {};
            if (itemObj.temperature?._id) derived.temperature = itemObj.temperature._id;
            if (itemObj.density?._id) derived.density = itemObj.density._id;
            if (itemObj.dimension?._id) derived.dimension = itemObj.dimension._id;
            if (itemObj?.productType) derived.productType = itemObj.productType;

            setToItemParams(prev => ({
                ...baseParams,
                ...prev,
                ...derived,
            }));
        }

        if (isFromChange) {
            setItemForm(Boolean(patch.fromItemId));
        }

        setForm(prev => ({ ...prev, ...patch }));
    }, [baseParams]);

    // Prefill/lock UOM from the "from" item
    useEffect(() => {
        if (fromMeta?.uom) {
            setForm((f) => ({ ...f, uom: fromMeta.uom }));
        }
    }, [fromMeta?.uom]);

    const submit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;       // prevent double submit
        if (!isValid) return;

        // Client-side productType guard (nice UX; backend also enforces)
        if (fromMeta?.productType && toMeta?.productType && String(fromMeta.productType) !== String(toMeta.productType)) {
            Toast.error('From/To items must have the same product type.');
            return;
        }

        setLoading(true);
        try {
            const body = {
                fromItemId: form.fromItemId,
                toItemId: form.toItemId,
                warehouseId: form.warehouseId,
                qty: qtyNumber,
                uom: form.uom.trim(),
                batchNo: form.batchNo?.trim() || null,
                bin: form.bin?.trim() || null,
                note: form.note?.trim() || '',
            };

            const res = await axiosInstance.post('/api/inventory/repack', body);

            if (res?.data?.status) {
                Toast.success('Packing changed successfully');
                setForm((f) => ({ ...f, qty: '', note: '' }));
                onSuccess?.(res.data);
            } else {
                const msg = res?.data?.message || 'Failed to change packing';
                Toast.error(msg);
            }
        } catch (err) {
            const code = err?.response?.status;
            if (code === 403) {
                Toast.error('You do not have permission to perform packing change.');
            } else {
                const msg = err?.response?.data?.message || err?.message || 'Failed to change packing';
                Toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFromItemChange = useCallback(
        (v, itemObj) => {
            setFromMeta(itemObj || null);
            handleChange({ fromItemId: v }, itemObj);
        },
        [handleChange]
    );

    const handleToItemChange = useCallback(
        (v, itemObj) => {
            setToMeta(itemObj || null);
            handleChange({ toItemId: v }, itemObj);
        },
        [handleChange]
    );

    const handleFromFocus = useCallback(() => {
        setItemForm(false);
    }, []);

    const warehouseOptions = useMemo(
        () => warehouses.map(w => ({ value: String(w._id), label: w.name })),
        [warehouses]
    );

    return (
        <form onSubmit={submit} className="rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between pb-4">
                <h2 className="font-bold text-lg text-most-text">Packing Change</h2>
                <button
                    type="submit"
                    disabled={loading}
                    className={`btn-primary ${!isValid || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}
                >
                    {loading ? 'Saving…' : 'Submit'}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 py-2 items-center">
                <div>
                    <StockItemSelect
                        name="fromItemId"
                        label="From Item (current packing)"
                        value={form.fromItemId}
                        onChange={handleFromItemChange}
                        required
                        disabled={loading}
                        apiparams={baseParams}
                        onFocus={handleFromFocus}
                    />
                </div>
                <div>
                    {itemForm && <StockItemSelect
                        name="toItemId"
                        label="To Item (target packing)"
                        value={form.toItemId}
                        onChange={handleToItemChange}
                        required
                        disabled={!itemForm}
                        readOnly={!itemForm}
                        apiparams={toItemParams}
                    />}
                </div>
            </div>

            {sameItem && (
                <p className="text-sm text-error">
                    From and To items must be different.
                </p>
            )}

            <div className="grid md:grid-cols-2 gap-3 py-2">
                <WarehouseSelect
                    value={form.warehouseId}
                    onChange={(v) => handleChange({ warehouseId: v })}
                    required
                    label="Warehouse"
                    disabled={loading}
                    options={warehouseOptions}
                />
                <CustomInput
                    label="UOM"
                    value={form.uom}
                    onChange={(e) => handleChange({ uom: e.target.value })}
                    required
                    placeholder="pcs / kg / roll"
                    disabled={Boolean(fromMeta?.uom) || loading} // lock if prefilled
                />
            </div>

            <div className="grid md:grid-cols-3 gap-3 py-2">
                <CustomInput
                    label="Quantity"
                    type="number"
                    min="0"
                    step="any"
                    value={form.qty}
                    onChange={(e) => handleChange({ qty: e.target.value })}
                    required
                    placeholder="quantity > 0"
                    disabled={loading}
                    err={error && 'Invalid quantity'}
                />
                <CustomInput
                    label="Batch"
                    value={form.batchNo}
                    onChange={(e) => handleChange({ batchNo: e.target.value })}
                    placeholder="optional"
                    disabled={loading}
                />
                <CustomInput
                    label="Bin"
                    value={form.bin}
                    onChange={(e) => handleChange({ bin: e.target.value })}
                    placeholder="optional"
                    disabled={loading}
                />
            </div>

            <TextArea
                label="Note"
                value={form.note}
                onChange={(e) => handleChange({ note: e.target.value })}
                rows={2}
                placeholder="Add a note (optional)"
                disabled={loading}
            />

            {/* Optional inline hints */}
            {fromMeta?.uom && (
                <div className="text-xs text-secondary-text">
                    UOM is set by the source item: <span className="font-medium">{fromMeta.uom}</span>
                </div>
            )}
        </form>
    );
}