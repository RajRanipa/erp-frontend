// src/app/(app)/settings/components/RoleSelect.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import { axiosInstance } from '@/lib/axiosInstance';
import Dialog from '@/Components/Dialog';
import CustomInput from '@/Components/inputs/CustomInput';
import CheckBox from '@/Components/inputs/CheckBox';
import { cn } from '@/utils/cn';
import SubmitButton from '../buttons/SubmitButton';

/**
 * RoleSelect
 * - Shows a searchable role dropdown using SelectTypeInput
 * - If the typed value doesn't exist, a "Create" action opens a confirm dialog
 * - Creation is delegated to `onCreateRole` (parent decides how to persist new roles)
 *
 * NOTE: Your current backend `Permission.roles` has a fixed enum
 *   ['owner','manager','store_operator','production_manager','accountant','investor'].
 * Creating brand-new roles requires backend support (schema + endpoints).
 * This component surfaces the UI and calls `onCreateRole(newKey)` so you can handle persistence.
 */
export default function RoleSelect({
    value,
    onChange,
    onCreateRole, // async (newKey) => { ... }  -> parent should create role server-side
    label = '',
    placeholder = 'Select a role…',
    disabled = false,
    parent_className = '',
    className = '',
    allowCreate = true,
}) {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]); // array of strings
    const [query, setQuery] = useState('');
    const roleSelectRef = useRef(null);
    // const packingSelectRef = useRef(null);
    // Create dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [draftRole, setDraftRole] = useState('');
    const [creating, setCreating] = useState(false);
    const [grantAccess, setGrantAccess] = useState(true); // grant initial permission like <role>:access
    const [createError, setCreateError] = useState('');

    // Load roles from API
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get('/api/permissions/roles');
                const data = res?.data?.roles || res?.data || [];
                setRoles(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Failed to load roles', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Convert roles -> options for SelectTypeInput
    const options = useMemo(() => {
        return roles.map((r) => ({ value: r, label: r }));
    }, [roles]);
    // When user types in SelectTypeInput, keep local query for deciding "create"

    // Triggered by the SelectTypeInput "Create ..." row
    const handleBeginCreate = () => {
        if (!allowCreate) return;
        const sanitized = (query || '').trim();
        setDraftRole(sanitized);
        setCreateError('');
        setShowDialog(true);
    };

    // Confirm create in dialog
    const handleConfirmCreate = async () => {
        const raw = (draftRole || '').trim();
        if (!raw) return setCreateError('Role name is required');
        // Suggest a normalized key but keep what user typed
        const key = raw
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
        if (!key) return setCreateError('Role key is invalid');
        if (roles.includes(key)) {
            setCreateError('This role already exists');
            return;
        }
        try {
            setCreating(true);
            setCreateError('');
            // Prefer parent to handle persistence
            if (typeof onCreateRole === 'function') {
                await onCreateRole(key);
            } else {
                // Fallback: attempt to set initial permission(s) for new role (may fail with current enum)
                try {
                    const initKeys = grantAccess ? [`'dashboard:read`] : [];
                    await axiosInstance.post('/api/permissions/role/set', { role: key, keys: initKeys });
                } catch (err) {
                    // Surface a helpful error
                    const msg =
                        err?.response?.data?.message ||
                        err?.response?.data?.error ||
                        err?.message ||
                        'Server rejected role creation. Backend must allow custom roles.';
                    setCreateError(msg);
                    return;
                }
            }
            // Optimistically add to local list and select it
            setRoles((prev) => [...prev, key]);
            onChange?.(key);
            setShowDialog(false);
        } catch (e) {
            setCreateError(e?.message || 'Failed to create role');
        } finally {
            setCreating(false);
        }
    };
    useEffect(() => {
        if (showDialog) {
            // roleSelectRef.current.focus();
            setDraftRole(value);
            setGrantAccess(true);
        }
    }, [showDialog]);

    return (
        <>
            {(!showDialog && options && options.length > 0) && <SelectTypeInput
                inputRef={roleSelectRef}
                name={'role'}
                label={label}
                placeholder={placeholder}
                value={value}
                options={options}
                onChange={onChange}
                disabled={disabled || loading}
                isLoading={loading}
                buttonName="create new role"
                callBack={setShowDialog}
                dropdownHeight='min-h-fit'
                parent_className={parent_className}
            />}

            <Dialog
                open={showDialog}
                onClose={() => setShowDialog(false)}
                getBackFocus={roleSelectRef}
                title="Create new role"
                side="right"
                size="sm"
                actions={
                    <>
                        <button type="button" className="btn" onClick={() => setShowDialog(false)}>
                            Cancel
                        </button>
                        <SubmitButton type="button" className="btn btn-primary" onClick={handleConfirmCreate}>
                            Save
                        </SubmitButton>
                    </>
                }
            >
                <div className="relative rounded-md max-w-md p-4">
                    <p className="text-sm mb-3">
                        Enter a role name. It will be normalized to a key like <code>store_operator</code>.
                    </p>
                    <CustomInput
                        label={'New Role Name'}
                        placeholder="e.g. store_operator"
                        value={draftRole}
                        onChange={(e) => setDraftRole(e.target.value)}
                        required
                        autoFocus
                    />
                    <CheckBox
                        id="grant_access"
                        type="checkbox"
                        // className="w-fit"
                        // parent_className='w-fit'
                        checked={grantAccess}
                        onChange={(e) => setGrantAccess(e.target.checked)}
                        label={"Grant Access"}
                        value={<code>dashboard:read</code>}
                        required
                    />
                    {/* i think we should sent one permistion key when we create role becuse only one permission is required , other wise only role will not make senses*/}
                    {createError ? (
                        <div className="text-sm text-error mb-2">{createError}</div>
                    ) : null}
                </div>
            </Dialog>

        </>
    );
}