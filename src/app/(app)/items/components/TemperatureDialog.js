'use client';
// src/app/items/components/TemperatureDialog.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import UnitSelect from '@/Components/inputs/UnitSelect';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import Dialog from '@/Components/Dialog';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

/**
 * TemperatureDialog - reusable dialog component to create or edit a Temperature
 * Props:
 *  - open: boolean
 *  - onClose: function
 *  - mode: 'create' | 'edit'
 *  - initialData: object (for edit mode) e.g. { _id, length, width, thickness, unit, category, productType }
 *  - categoryReadonly: boolean
 *  - productTypeReadonly: boolean
 *  - onSaved: fn(doc) called after create/update
 *  - onDeleted: fn(id) called after delete
 */
export default function TemperatureDialog({
  open,
  onClose,
  mode = 'create',
  initialData = {},
  categoryReadonly = false,
  productTypeReadonly = false,
  getBackFocus = null,
  onSaved = () => {},
  onDeleted = () => {},
}) {
  
  const createUrl = '/api/temperatures';

  const initialDraft = {
    value: initialData.value ?? '',
    unit: initialData.unit ?? '˚C',
    productType: initialData.productType ?? '',
  };

  const [dialogData, setDialogData] = useState(initialDraft);
  const dialogDataRef = useRef(dialogData);
  useEffect(() => { dialogDataRef.current = dialogData; }, [dialogData]);

  // Keep dialogData in sync with initialData when open or when initialData changes
  useEffect(() => {
    if (open) {
      setDialogData({
        value: initialData.value ?? '',
        unit: initialData.unit ?? '˚C',
        productType: initialData.productType ?? '',
      });
    }
  }, [open, initialData]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const lengthInputRef = useRef(null);

  // focus management: focus first input when open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => { lengthInputRef.current?.focus?.(); }, 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const onDraftChange = useCallback((e) => {
    const { name, value } = e.target;
    setDialogData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validate = (raw) => {
    const hasValue = raw.value !== undefined && raw.value !== null && String(raw.value).trim() !== '';
    if (!hasValue) return { ok: false, message: 'Value is required for temperature.' };
    if (!raw.unit || String(raw.unit).trim() === '') return { ok: false, message: 'Unit is required.' };
    return { ok: true };
  };

  const buildPayload = (raw) => ({
    value: raw.value ? Number(raw.value) : 0,
    unit: String(raw.unit).trim(),
    ...(raw.productType ? { productType: raw.productType } : {}),
  });

  const handleSave = useCallback(async () => {
    try {
      const raw = dialogDataRef.current || {};
      const v = validate(raw);
      if (!v.ok) { Toast.error( v.message); return; }

      const payload = buildPayload(raw);
      setSaving(true);

      if (mode === 'create') {
        const res = await axiosInstance.post(createUrl, payload);
        const doc = res?.data?.data || res?.data;
        Toast.success(res?.data?.message || 'Temperature created');
        onSaved(doc);
      } else {
        // edit
        const id = initialData._id;
        if (!id) {
          Toast.error( 'Missing id for update' );
          setSaving(false);
          return;
        }
        const res = await axiosInstance.put(`${createUrl}/${id}`, payload);
        const doc = res?.data?.data || res?.data;
        Toast.success(res?.data?.message || 'Temperature updated');
        onSaved(doc);
      }

      setSaving(false);
      onClose?.();
      // reset
      setDialogData(initialDraft);
      // return focus
    } catch (err) {
      console.error('Temperature save error', err);
      const msg = err?.response?.data?.message || 'Failed to save temperature';
      Toast.error( msg );
      setSaving(false);
    }
  }, [mode, initialData, onSaved, onClose, initialDraft]);

  const handleDelete = useCallback(async () => {
    try {
      if (!initialData._id) return Toast.error( 'Missing id for delete' );
      if (!confirm('Are you sure you want to delete this temperature?')) return;
      setDeleting(true);
      await axiosInstance.delete(`${createUrl}/${initialData._id}`);
      Toast.success('Deleted successfully' );
      onDeleted(initialData._id);
      setDeleting(false);
      onClose?.();
      setDialogData(initialDraft);
    } catch (err) {
      console.error('Temperature delete error', err);
      Toast.error( err?.response?.data?.message || 'Failed to delete');
      setDeleting(false);
    }
  }, [initialData, onDeleted, onClose, initialDraft]);

  return (
    <Dialog
      open={open}
      title={mode === 'create' ? 'Add Temperature' : 'Edit Temperature'}
      onClose={() => { onClose?.(); setDialogData(initialDraft); }}
      side="right"
      size="sm"
      getBackFocus={getBackFocus}
      actions={(
        <>
          <button type="button" className="btn" onClick={() => { onClose?.(); setDialogData(initialDraft); }} disabled={saving || deleting}>Cancel</button>
          {mode === 'edit' && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || deleting}>
            {saving ? (mode === 'create' ? 'Saving...' : 'Updating...') : (mode === 'create' ? 'Save' : 'Update')}
          </button>
        </>
      )}
    >
      <div className="space-y-3">
        <CustomInput inputRef={lengthInputRef} type="number" label={"Value"} name="value" placeholder="e.g. 7850" value={dialogData.value} onChange={onDraftChange} />
        <UnitSelect name="unit" label="Unit" type="Temperature" value={dialogData.unit} onChange={onDraftChange} required />

        <SelectTypeInput
          type="text"
          label={"Product Type"}
          name="productType"
          placeholder="Product Type"
          apiget="/api/product-type"
          value={dialogData.productType}
          userSelectedValue={dialogData.productType}
          onChange={onDraftChange}
          readOnly={productTypeReadonly}
          required
          allowCustomValue={false}
        />
      </div>
    </Dialog>
  );
}