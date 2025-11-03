

'use client';
import React, { memo, useCallback, useMemo } from 'react';
import CustomInput from '@/components/inputs/CustomInput';
import SelectInput from '@/components/inputs/SelectInput';
import RadioButton from '@/components/inputs/RadioButton';
import SelectTypeInput from '@/components/inputs/SelectTypeInput';
import TextArea from '@/components/inputs/TextArea';
import { useToast } from '@/components/toast';
import FormHolder from '@/components/inputs/FormHolder';

/**
 * CreditFields
 * Controlled editor for Party.credit (customers)
 *
 * Props:
 *  - value: { currency, paymentTerm, creditLimit, onHold, notes }
 *  - onChange: (next) => void
 */

const valOf = (e) => (e && e.target !== undefined
    ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
    : e);

const TERM_OPTIONS = [
    { label: 'Advance', value: 'ADVANCE' },
    { label: 'NET 7', value: 'NET7' },
    { label: 'NET 15', value: 'NET15' },
    { label: 'NET 30', value: 'NET30' },
    { label: 'NET 45', value: 'NET45' },
    { label: 'NET 60', value: 'NET60' },
];

const CURRENCY_OPTIONS = [
    { label: 'INR (₹)', value: 'INR' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
];

const CreditCard = memo(function CreditCard({ data, onField, toast }) {
    const onLimitChange = useCallback((e) => {
        const raw = valOf(e);
        const num = Number(raw);
        if (Number.isNaN(num)) return onField('creditLimit', 0);
        if (num < 0) {
            toast({ type: 'error', message: 'Credit limit cannot be negative' });
            return onField('creditLimit', 0);
        }
        onField('creditLimit', num);
    }, [onField, toast]);

    return (
        <div className="rounded space-y-4">
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-3">
                <SelectInput
                    name="credit.currency"
                    value={data.currency || 'INR'}
                    onChange={(e) => onField('currency', valOf(e))}
                    options={CURRENCY_OPTIONS}
                    placeholder="Currency"
                    required
                />

                <SelectInput
                    name="credit.paymentTerm"
                    value={data.paymentTerm || 'NET30'}
                    onChange={(e) => onField('paymentTerm', valOf(e))}
                    options={TERM_OPTIONS}
                    placeholder="Payment term"
                    required
                />

                <CustomInput
                    type="number"
                    name="credit.creditLimit"
                    placeholder="Credit limit"
                    value={data.creditLimit ?? 0}
                    onChange={onLimitChange}
                    min={0}
                    step={1}
                />

                <div className="flex items-center gap-3 w-full col-span-3">
                    <input
                        type="checkbox"
                        name="credit.onHold"
                        value={data.onHold || false}
                        onChange={(e) => onField('onHold', valOf(e))}
                        className='mb-5'
                    />
                    <label htmlFor="credit.onHold" className="text-sm mb-5 w-fit">Credit on hold</label>

                    <TextArea
                        name="credit.notes"
                        placeholder="Notes (optional)"
                        value={data.notes || ''}
                        onChange={(e) => onField('notes', valOf(e))}
                    />
                </div>
            </div>


        </div>
    );
});

export default function CreditFields({ value = {}, onChange, onClose }) {
    const toast = useToast();
    const data = useMemo(() => ({
        currency: 'INR', paymentTerm: 'NET30', creditLimit: 0, onHold: false, notes: '',
        ...value,
    }), [value]);

    const set = useCallback((patch) => {
        onChange?.({ ...data, ...patch });
    }, [onChange, data]);

    const onField = useCallback((key, val) => set({ [key]: val }), [set]);

    return (
        <FormHolder title={'Credit (Customers)'}
            submitbtn={
                onClose && (
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        close
                    </button>
                )}
        >
            <CreditCard data={data} onField={onField} toast={toast} />
        </FormHolder >
    );
}