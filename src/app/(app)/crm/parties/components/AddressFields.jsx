'use client';
import React, { memo, useCallback, useEffect, useState, useRef } from 'react';

import CustomInput from '@/Components/inputs/CustomInput';
import Dialog from '@/Components/Dialog';
import FormHolder from '@/Components/inputs/FormHolder';
import SubmitButton from '@/Components/buttons/SubmitButton';

const valOf = (e) =>
    e && e.target !== undefined
        ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
        : e;

/**
 * AddressFields
 * Controlled list editor for Party.addresses
 *
 * Props:
 *  - value: Address[]
 *  - onChange: (next: Address[]) => void
 *
 * Address shape:
 *  { label, line1, line2, city, state, stateCode, country, pincode, isDefaultBilling, isDefaultShipping }
 */
const emptyAddress = () => ({
    label: 'Billing',
    line1: '',
    line2: '',
    city: '',
    state: '',
    stateCode: '',
    country: 'IN',
    pincode: '',
    isDefaultBilling: true,
    isDefaultShipping: true,
});

const AddressCard = memo(function AddressCard({ idx, a, onField, onSetDefault, onToggleShipping, title }) {
    return (
        <>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3">
                <CustomInput
                    name={`addresses[${idx}].line1`}
                    label={"Address line 1"}
                    placeholder="123, ABC Street"
                    value={a.line1 || ''}
                    onChange={(e) => onField(idx, 'line1', valOf(e))}
                    required
                />
                <CustomInput
                    name={`addresses[${idx}].line2`}
                    label={"Address line 2"}
                    placeholder="XYZ Colony"
                    value={a.line2 || ''}
                    onChange={(e) => onField(idx, 'line2', valOf(e))}
                />
                <div className="col-span-2 grid grid-cols-4 gap-2">
                    <CustomInput
                        name={`addresses[${idx}].city`}
                        label={"City"}
                        placeholder="Ahemdabad"
                        value={a.city || ''}
                        onChange={(e) => onField(idx, 'city', valOf(e))}
                        required
                    />
                    <CustomInput
                        name={`addresses[${idx}].state`}
                        label={"State"}
                        placeholder="Gujarat"
                        value={a.state || ''}
                        onChange={(e) => onField(idx, 'state', valOf(e))}
                        required
                    />
                    <CustomInput
                        name={`addresses[${idx}].stateCode`}
                        label={"State Code"}
                        placeholder="(ex. 24 for gujarat)"
                        value={a.stateCode || ''}
                        onChange={(e) => onField(idx, 'stateCode', valOf(e))}
                    />
                    <CustomInput
                        type="number"
                        name={`addresses[${idx}].pincode`}
                        label="Pincode"
                        placeholder="380001"
                        value={a.pincode || ''}
                        onChange={(e) => onField(idx, 'pincode', valOf(e))}
                        required
                    />
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!a.isDefaultBilling}
                      readOnly
                      disabled
                      aria-label="Billing address is fixed per entry and cannot be toggled here"
                    />
                    <span>Default billing</span>
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={a.isDefaultShipping !== false}
                      onChange={(e) => onToggleShipping?.(idx, e.target.checked)}
                    />
                    <span>Default shipping</span>
                </label>
            </div>
        </>
    );
});

export default function AddressFields({ value = [], onChange }) {
    const set = useCallback((next) => onChange?.(next), [onChange]);

    const [shipDialog, setShipDialog] = useState({ open: false, sourceIdx: null, draft: null });

    useEffect(() => {
        if (!value || value.length === 0) {
            set([emptyAddress()]);
        }
    }, [value, set]);

    const onField = useCallback((idx, key, val) => {
        set(value.map((a, i) => (i === idx ? { ...a, [key]: val } : a)));
    }, [value, set]);

    const add = useCallback(() => {
        const base = emptyAddress();
        set([...(value || []), { ...base, isDefaultBilling: false, isDefaultShipping: false }]);
    }, [value, set]);

    const setDefault = useCallback((idx, type) => {
        set(value.map((a, i) => {
            if (type === 'billing') {
                // Toggle behavior: if the clicked one is already default, turn all off; else set only this one on.
                const willBeOn = i === idx ? !a.isDefaultBilling : false;
                return { ...a, isDefaultBilling: willBeOn, isDefaultShipping: a.isDefaultShipping };
            } else {
                const willBeOn = i === idx ? !a.isDefaultShipping : false;
                return { ...a, isDefaultShipping: willBeOn, isDefaultBilling: a.isDefaultBilling };
            }
        }));
    }, [value, set]);

    const onToggleShipping = useCallback((idx, nextChecked) => {
      if (nextChecked) {
        // Set only this address as default shipping
        set(value.map((a, i) => ({ ...a, isDefaultShipping: i === idx })));
      } else {
        // Open dialog to capture a new shipping address; keep current as shipping until save.
        setShipDialog({
          open: true,
          sourceIdx: idx,
          draft: {
            ...emptyAddress(),
            label: 'Shipping',
            isDefaultBilling: false,
            isDefaultShipping: true,
          },
        });
      }
    }, [set, value]);

    const saveShipDialog = useCallback(() => {
      if (!shipDialog.open) return;
      const src = shipDialog.sourceIdx;
      const draft = shipDialog.draft;
      // Add the new address as shipping default, turn off shipping on source
      const next = (value || []).map((a, i) => (i === src ? { ...a, isDefaultShipping: false } : a));
      next.push({ ...draft, label: 'Shipping', isDefaultShipping: true, isDefaultBilling: false });
      set(next);
      setShipDialog({ open: false, sourceIdx: null, draft: null });
    }, [shipDialog, set, value]);

    const cancelShipDialog = useCallback(() => {
      // Do nothing to data; simply close
      setShipDialog({ open: false, sourceIdx: null, draft: null });
    }, []);
    const onDraftField = useCallback((key, val) => {
      setShipDialog((d) => ({ ...d, draft: { ...(d.draft || {}), [key]: val } }));
    }, []);

    return (
        <FormHolder title="Addresses" submitbtn={
            <button type="button" className="btn btn-primary" onClick={add}>
                Add address
            </button>
        }>
            <div className="space-y-3">
                {(value || []).map((a, idx) => (
                    <AddressCard
                        key={idx}
                        idx={idx}
                        a={a}
                        onField={onField}
                        onSetDefault={setDefault}
                        onToggleShipping={onToggleShipping}
                    />
                ))}
            </div>
            <Dialog
              open={shipDialog.open}
              title="Add a new shipping address"
              onClose={cancelShipDialog}
              side="right"
              size="md"
              actions={
                <>
                  <button type="button" className="btn" onClick={cancelShipDialog}>Cancel</button>
                  <SubmitButton type="button" onClick={saveShipDialog} label='Save Address'/>
                </>
              }
            >
              <div className="flex flex-col gap-3">
                <CustomInput
                  name="draft.line1"
                  label= "Address line 1"
                  placeholder="Address line 1 *"
                  value={shipDialog.draft?.line1 || ''}
                  onChange={(e) => onDraftField('line1', valOf(e))}
                  required
                />
                <CustomInput
                  name="draft.line2"
                  label="Address line 2"
                  placeholder="Address line 2"
                  value={shipDialog.draft?.line2 || ''}
                  onChange={(e) => onDraftField('line2', valOf(e))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    name="draft.city"
                    label="City"
                    placeholder="Ahmedabad
"
                    value={shipDialog.draft?.city || ''}
                    onChange={(e) => onDraftField('city', valOf(e))}
                    required
                  />
                  <CustomInput
                    name="draft.state"
                    label="State"
                    placeholder="Gujarat"
                    value={shipDialog.draft?.state || ''}
                    onChange={(e) => onDraftField('state', valOf(e))}
                    required
                  />
                  </div>
                  <div className=" grid grid-cols-2 gap-2">
                  <CustomInput
                    name="draft.stateCode"
                    label={"State Code"}
                    placeholder="(ex. 24 for gujarat)"
                    value={shipDialog.draft?.stateCode || ''}
                    onChange={(e) => onDraftField('stateCode', valOf(e))}
                  />
                  <CustomInput
                    type="number"
                    name="draft.pincode"
                    label="Pincode"
                    placeholder="380001"
                    value={shipDialog.draft?.pincode || ''}
                    onChange={(e) => onDraftField('pincode', valOf(e))}
                    required
                  />
                </div>
              </div>
            </Dialog>
        </FormHolder>
    );
}