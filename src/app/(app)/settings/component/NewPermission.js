// src/app/(app)/settings/components/NewPermission.jsx
'use client';
import React, { useMemo, useState } from 'react';
import Dialog from '@/Components/Dialog';
import CustomInput from '@/Components/inputs/CustomInput';
import CheckBox from '@/Components/inputs/CheckBox';
import {axiosInstance} from '@/lib/axiosInstance';
import { cn } from '@/utils/cn';
import { addIcon } from '@/utils/SVG';
import { Toast } from '@/Components/toast';

/**
 * NewPermission
 * A controlled dialog component to create a permission key, with optional immediate assignment to a role.
 *
 * Props:
 *  - open: boolean (controlled)
 *  - setOpen: (bool) => void
 *  - onCreated?: (permissionDoc) => void // called with the created/returned permission
 *  - selectedRole?: string               // if provided, can optionally assign this key to the role
 */
const NewPermission = ({ open, setOpen, onCreated, selectedRole }) => {
    const [keyInput, setKeyInput] = useState('');
    const [labelInput, setLabelInput] = useState('');
    const [assignNow, setAssignNow] = useState(Boolean(selectedRole));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // normalize: trim, spaces->_, strip non word except colon, lowercase
    const normalizedKey = useMemo(() => {
        const raw = (keyInput || '').trim();
        if (!raw) return '';
        return raw
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_:]/g, '')
            .toLowerCase();
    }, [keyInput]);

    const hasColon = useMemo(() => normalizedKey.includes(':'), [normalizedKey]);
    const moduleName = useMemo(() => (hasColon ? normalizedKey.split(':')[0] : ''), [hasColon, normalizedKey]);

    const reset = () => {
        setKeyInput('');
        setLabelInput('');
        setAssignNow(Boolean(selectedRole));
        setError('');
    };

    const handleClose = () => {
        if (submitting) return;
        setOpen(false);
        // do not reset immediately so user can reopen and see previous state if needed
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (submitting) return;

        // basic validation
        if (!normalizedKey) {
            setError('Permission key is required');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // 1) Create (or upsert) the permission
            const createRes = await axiosInstance.post('/api/permissions', {
                key: normalizedKey,
                label: labelInput?.trim() || undefined,
            });
            const created = createRes?.data?.data || createRes?.data;

            // 2) Optionally assign to role
            if (assignNow && selectedRole) {
                await axiosInstance.post('/api/permissions/role/add', {
                    role: selectedRole,
                    keys: [normalizedKey],
                });
            }

            // 3) Notify parent and close
            onCreated?.(created);
            setOpen(false);
            reset();
            Toast.success('Permission created');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create permission';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };
    // console.log('selectedRole', selectedRole)
    return (
        <>
            {/* Trigger button (hidden while dialog open) */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn('btn-primary flex items-center gap-2 h-fit', open && 'hidden')}
            >
                {addIcon()}
                New Permission
            </button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title="Create new role"
                side="right"
                size="sm"
                actions={
                    <>
                        <button type="button" className="btn-secondary" onClick={handleClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn-primary disabled:opacity-60" disabled={submitting} onClick={handleSubmit}>
                            {submitting ? 'Creating…' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="p-2 md:p-3">
                    <h3 className="text-lg font-semibold mb-2">Create permission</h3>

                    <CustomInput
                        label="Permission key"
                        name="permission_key"
                        placeholder="e.g. inventory:approve"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        required
                        autoFocus
                    />

                    {normalizedKey ? (
                        <div className="-mt-4 mb-3 text-xs text-white-500">
                            Normalized: <code className="text-white-700">{normalizedKey}</code>
                            {!hasColon && <span className="ml-2 text-error">Tip: include a module prefix like <code>items:read</code></span>}
                        </div>
                    ) : null}

                    <CustomInput
                        label="Label (optional)"
                        name="permission_label"
                        placeholder="Human readable label"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                    />

                    {selectedRole ? (
                        <div className="mt-1">
                            <CheckBox
                                name="assign_now"
                                label={
                                    moduleName
                                        ? `Assign to role \"${selectedRole}\" now`
                                        : `Assign to role \"${selectedRole}\" now`
                                }
                                checked={assignNow}
                                onChange={(e) => setAssignNow(e.target.checked)}
                            />
                        </div>
                    ) : null}

                    {error ? <div className="text-error text-sm -mt-3 mb-3">{error}</div> : null}

                    <div className="flex justify-end gap-2 pt-2">
                        
                    </div>
                </form>
            </Dialog>
        </>
    );
};

export default NewPermission;