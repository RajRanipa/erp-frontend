'use client';

import React, { useState } from 'react';
import SelectInput from '@/Components/inputs/SelectInput';
import CustomInput from '@/Components/inputs/CustomInput';

import ExportPartiesButton from './ExportPartiesButton';
import ImportPartiesModal from './ImportPartiesModal';

const ROLE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'SUPPLIER', label: 'Suppliers' },
    { value: 'CUSTOMER', label: 'Customers' },
    { value: 'TRANSPORTER', label: 'Transporters' },
    { value: 'JOBWORKER', label: 'Job Workers' },
    { value: 'BROKER', label: 'Brokers' },
    { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function PartiesToolbar({
    role,
    status,
    q,
    onRoleChange,
    onStatusChange,
    onQueryChange,
    onRefresh,
    loading = false,
}) {
    const [openImport, setOpenImport] = useState(false);

    return (
        <>
            <div className="flex gap-3 items-center justify-between w-full">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold">Parties</h1>
                    <p className="text-secondary-text/70 text-sm text-nowrap">Customers, suppliers, transporters & more.</p>
                </div>
                <div className="flex gap-3">
                    <SelectInput
                        value={role}
                        onChange={(e) => onRoleChange?.(e.target.value)}
                        options={ROLE_OPTIONS}
                    />

                    <SelectInput
                        //   label="Status"
                        value={status}
                        onChange={(e) => onStatusChange?.(e.target.value)}
                        options={STATUS_OPTIONS}
                    />

                    <CustomInput
                        className="md:min-w-[280px]"
                        value={q}
                        onChange={(e) => onQueryChange?.(e.target.value)}
                        placeholder="Search by name, phone, email, GSTIN…"
                    />

                    <button
                        type="button"
                        className="btn-secondary w-fit h-fit"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh"
                    >
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>

                    <ExportPartiesButton
                        role={role === 'all' ? '' : role}
                        status={status}
                        q={q}
                        className="btn-secondary h-fit text-nowrap"
                    >
                        Export
                    </ExportPartiesButton>

                    <button
                        type="button"
                        className="btn-secondary w-fit h-fit"
                        onClick={() => setOpenImport(true)}
                        title="Import Excel"
                    >
                        Import
                    </button>
                </div>
            </div>
            <ImportPartiesModal
                open={openImport}
                onClose={() => setOpenImport(false)}
                onImported={() => onRefresh?.()}
            />
        </>
    );
}
