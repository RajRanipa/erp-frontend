'use client';
// src/app/items/components/DimensionDialog.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomInput from '@/components/inputs/CustomInput';
import UnitSelect from '@/components/inputs/UnitSelect';
import SelectTypeInput from '@/components/inputs/SelectTypeInput';
import Dialog from '@/components/Dialog';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/toast';
import Dimension from './Dimension';

/**
 * DimensionDialog - reusable dialog component to create or edit a Dimension
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
export default function DimensionDialog({
  open,
  onClose,
  mode = 'create',
  initialData = {},
  categoryReadonly = false,
  productTypeReadonly = false,
  onSaved = () => {},
  onDeleted = () => {},
  getBackFocus = null,
}) {
  const toast = useToast();
  const createUrl = '/api/dimensions';

  const initialDraft = {
    length: initialData.length ?? '',
    width: initialData.width ?? '',
    thickness: initialData.thickness ?? '',
    unit: initialData.unit ?? 'mm',
    category: initialData.category ?? '',
    productType: initialData.productType ?? '',
  };

  const [dialogData, setDialogData] = useState(initialDraft);
  const dialogDataRef = useRef(dialogData);
  useEffect(() => { dialogDataRef.current = dialogData; }, [dialogData]);

  // Keep dialogData in sync with initialData when open or when initialData changes
  useEffect(() => {
    if (open) {
      setDialogData({
        length: initialData.length ?? '',
        width: initialData.width ?? '',
        thickness: initialData.thickness ?? '',
        unit: initialData.unit ?? 'mm',
        category: initialData.category ?? (initialData.category_label ?? ''),
        productType: initialData.productType ?? '',
      });
    }
  }, [open, initialData]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDraftChange = useCallback((e) => {
    const { name, value } = e.target;
    setDialogData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validate = (raw) => {
    const hasAny = [raw.length, raw.width, raw.thickness]
      .some(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (!hasAny) return { ok: false, message: 'At least one of length, width or thickness is required.' };
    if (!raw.unit || String(raw.unit).trim() === '') return { ok: false, message: 'Unit is required.' };
    return { ok: true };
  };

  const buildPayload = (raw) => ({
    length: raw.length ? Number(raw.length) : 0,
    width: raw.width ? Number(raw.width) : 0,
    thickness: raw.thickness ? Number(raw.thickness) : 0,
    unit: String(raw.unit).trim(),
    ...(raw.productType ? { productType: raw.productType } : {}),
    ...(raw.category ? { category: raw.category } : {}),
  });

  const handleSave = useCallback(async () => {
    try {
      const raw = dialogDataRef.current || {};
      const v = validate(raw);
      if (!v.ok) { toast({ type: 'error', message: v.message }); return; }

      const payload = buildPayload(raw);
      setSaving(true);

      if (mode === 'create') {
        const res = await axiosInstance.post(createUrl, payload);
        const doc = res?.data?.data || res?.data;
        toast({ type: 'success', message: res?.data?.message || 'Dimension created' });
        onSaved(doc);
      } else {
        // edit
        const id = initialData._id;
        if (!id) {
          toast({ type: 'error', message: 'Missing id for update' });
          setSaving(false);
          return;
        }
        const res = await axiosInstance.put(`${createUrl}/${id}`, payload);
        const doc = res?.data?.data || res?.data;
        toast({ type: 'success', message: res?.data?.message || 'Dimension updated' });
        onSaved(doc);
      }

      setSaving(false);
      onClose?.();
      // reset
      setDialogData(initialDraft);
    } catch (err) {
      console.error('Dimension save error', err);
      const msg = err?.response?.data?.message || 'Failed to save dimension';
      toast({ type: 'error', message: msg });
      setSaving(false);
    }
  }, [mode, initialData, onSaved, onClose,  toast]);

  const handleDelete = useCallback(async () => {
    try {
      if (!initialData._id) return toast({ type: 'error', message: 'Missing id for delete' });
      if (!confirm('Are you sure you want to delete this dimension?')) return;
      setDeleting(true);
      await axiosInstance.delete(`${createUrl}/${initialData._id}`);
      toast({ type: 'success', message: 'Deleted successfully' });
      onDeleted(initialData._id);
      setDeleting(false);
      onClose?.();
      setDialogData(initialDraft);
    } catch (err) {
      console.error('Dimension delete error', err);
      toast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete' });
      setDeleting(false);
    }
  }, [initialData, onDeleted, onClose,  toast]);

  return (
    <Dialog
      open={open}
      title={mode === 'create' ? 'Add Dimension' : 'Edit Dimension'}
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
        <CustomInput type="number" label={"Length"} name="length" placeholder="1000" value={dialogData.length} onChange={onDraftChange} />
        <CustomInput type="number" label={"Width"} name="width" placeholder="500" value={dialogData.width} onChange={onDraftChange} />
        <CustomInput type="number" label={"Thickness"} name="thickness" placeholder="25" value={dialogData.thickness} onChange={onDraftChange} />
        <UnitSelect name="unit" label="Unit" type="Dimension" value={dialogData.unit} onChange={onDraftChange} required />

        <SelectTypeInput
          placeholder="Category"
          label={"Category"}
          name="category"
          value={dialogData.category}
          userSelectedValue={dialogData.category}
          onChange={onDraftChange}
          readOnly={categoryReadonly}
          required
          apiget='/api/category'
          allowCustomValue={false}
        />

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