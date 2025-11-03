'use client';
import React, { memo, useCallback } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import TextArea from '@/Components/inputs/TextArea';
import { Toast } from '@/Components/toast';
import FormHolder from '@/Components/inputs/FormHolder';

/**
 * ContactFields
 * Controlled list editor for Party.contacts
 *
 * Props:
 *  - value: Contact[]
 *  - onChange: (next: Contact[]) => void
 *
 * Contact shape:
 *  { name, email, phone, role, isPrimary, notes }
 */

const emptyContact = () => ({
    name: '',
    email: '',
    phone: '',
    role: 'Owner',
    isPrimary: false,
    notes: '',
});

const valOf = (e) => (e && e.target !== undefined
    ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
    : e);

const ROLE_OPTIONS = [
    { label: 'Owner', value: 'Owner' },
    { label: 'Purchase', value: 'Purchase' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Accounts', value: 'Accounts' },
    { label: 'Operations', value: 'Operations' },
];

const ContactCard = memo(function ContactCard({ idx, c, onField, onRemove, onSetPrimary }) {
    return (
        <div className="rounded space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 w-full">
                    <CustomInput
                        name={`contacts[${idx}].name`}
                        placeholder="Full name *"
                        value={c.name || ''}
                        onChange={(e) => onField(idx, 'name', valOf(e))}
                        required
                    />
                    <input
                        type="checkbox"
                        name="contacts-primary"
                        value={String(idx)}
                        checked={!!c.isPrimary}
                        onChange={() => onSetPrimary(idx)}
                        className='mb-5'
                    />
                    <label htmlFor="contacts-primary" className="text-sm mb-5">Primary</label>
                    <button type="button" className="btn mb-5" onClick={() => onRemove(idx)}>Remove</button>
                </div>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-3">
                <CustomInput
                    type="email"
                    name={`contacts[${idx}].email`}
                    placeholder="Email"
                    value={c.email || ''}
                    onChange={(e) => onField(idx, 'email', valOf(e))}
                />
                <CustomInput
                    name={`contacts[${idx}].phone`}
                    placeholder="Phone"
                    value={c.phone || ''}
                    onChange={(e) => onField(idx, 'phone', valOf(e))}
                />
                <SelectInput
                    name={`contacts[${idx}].role`}
                    value={c.role || 'Owner'}
                    onChange={(e) => onField(idx, 'role', valOf(e))}
                    options={ROLE_OPTIONS}
                    placeholder="Role"
                />
            </div>

            <TextArea
                name={`contacts[${idx}].notes`}
                placeholder="Notes (optional)"
                value={c.notes || ''}
                onChange={(e) => onField(idx, 'notes', valOf(e))}
            />
        </div>
    );
});

export default function ContactFields({ value = [], onChange, onClose }) {
    const set = useCallback((next) => onChange?.(next), [onChange]);

    const onField = useCallback((idx, key, val) => {
        set(value.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
    }, [value, set]);

    const add = useCallback(() => {
        set([...(value || []), emptyContact()]);
    }, [value, set]);

    const remove = useCallback((idx) => {
        const next = (value || []).filter((_, i) => i !== idx);
        const wasPrimary = value?.[idx]?.isPrimary;
        if (next.length === 0) {
            // keep at least one contact row for UX; show Toast
            Toast.error('At least one contact is recommended');
            return;
        }
        if (wasPrimary && next.length > 0) {
            // promote first remaining as primary
            next[0] = { ...next[0], isPrimary: true };
        }
        set(next);
    }, [value, set, Toast]);

    const setPrimary = useCallback((idx) => {
        set((value || []).map((c, i) => ({ ...c, isPrimary: i === idx })));
    }, [value, set]);

    return (
        <FormHolder title={"Contacts"}
            submitbtn={<>
                {onClose && (
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        close
                    </button>
                )}
                <button type="button" className="btn btn-primary" onClick={add}>Add contact</button>
            </>
            }>
            <div className="space-y-3">
                {(value && value.length > 0 ? value : [emptyContact()]).map((c, idx) => (
                    <ContactCard
                        key={idx}
                        idx={idx}
                        c={c}
                        onField={onField}
                        onRemove={remove}
                        onSetPrimary={setPrimary}
                    />
                ))}
            </div>
        </FormHolder>

    );
}