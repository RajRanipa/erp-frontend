import SelectInput from '@/Components/inputs/SelectInput'
import { cn } from '@/utils/cn';
import React from 'react'

const ROLE_OPTIONS = [
    { label: 'owner', value: 'owner' },
    { label: 'manager', value: 'manager' },
    { label: 'store_operator', value: 'store_operator' },
    { label: 'production_manager', value: 'production_manager' },
    { label: 'accountant', value: 'accountant' },
    { label: 'investor', value: 'investor' },
];
export default function RoleSelect({ value, onChange, label, className }) {
    return (
        <SelectInput
            className={cn(className)}
            value={value || 'viewer'}
            onChange={(e) => onChange?.(e)}
            options={ROLE_OPTIONS}
            name="role"
            label={label}
        />
    )
}
